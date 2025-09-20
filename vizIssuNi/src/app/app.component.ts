
// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StoreService } from '../services/store.service';
import { AuthService } from '../services/auth.service';
import {
  PointControle,
  PointReponse,
  Fermeture,
  ObjetIN,
  OTFils,
  RapportIntervention,
  ChoixEffectues
} from '../models/intervention.model';
import { LoginComponent } from './login.component'; // Importez votre composant de connexion



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,    FormsModule,  MatButtonModule,    MatButtonToggleModule,    MatCardModule,
      MatCheckboxModule,   MatChipsModule,    MatDatepickerModule,    MatDividerModule,  MatFormFieldModule,
      MatIconModule, MatInputModule ,  MatNativeDateModule, MatProgressBarModule,
      MatProgressSpinnerModule ,  MatSelectModule ,   MatSnackBarModule , MatToolbarModule,LoginComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

 // État de l'application
  isAuthenticated = false;
  currentUser: any = null;
  currentStep :number= 1;
  loading = false;
  showCommentaire = false;

  // Données
  loginData = { email: '', password: '' };
  fermetures: Fermeture[] = []; // Liste des fermetures

  datesPrevisionnelles: string[] = [];
  objetsDisponibles:  ObjetIN[] = [];
  niveauxDisponibles: string[] = [];

  pointsControle: PointControle[] = [];
  filteredPointsControle: PointControle[] = [];
  optionsResponse: PointControle[] = [];
  tousPCRenseignes: boolean = false ;
  // Sélections
  selectedFermetureId = '';
  selectedFermeture: Fermeture | null = null;
  selectedDate: string | null = null;
  selectedStatut: 'A faire' |  'Terminé'= 'A faire';
  selectedTypeObjet: string = 'issue';
  issueNiche: string[] = ['issue', 'niche'];
  selectedObjet:{'codeObjet':string ,'codeEx':string} | null = null;
  selectedNiveauFilter: string = '';
  selectedNiveau ='';
  selectedOtPere: any | null = null;
  otFilsDisponibles: any[] = [];
  otFiDisponibles: OTFils[]=[];
  otPereDisponibles : {otPere:string, niveau:string}[] = [];
  choix: ChoixEffectues = {};
  otFilter = 'Tous';

  // Intervention en cours
  currentOT: OTFils| null = null;
  currentControl: PointControle | null = null;

  selectedResponseCtr: PointControle | null = null;  // RC selectionné par l'utilisateur
  reponses: PointReponse[]= [];
  currentResponse: PointReponse | null = null;
  nonVideResponse: PointReponse = {
  codePC: '',
  codeRC: '',
  commentaire: '',
  horodate: ''
  };
  currentRapport: RapportIntervention | null = null;
  commentaireObligatoire = false;
  fermetureCodeLibelle: any[]=[];

  constructor(
    private storeService : StoreService,
    private authService : AuthService,
    private snackBar: MatSnackBar
  ) {  }

  async ngOnInit() {
    this.authService.getCurrentUser().subscribe(async user => {
      this.isAuthenticated = !!user;
      this.currentUser = user;
      if (user) {
      await this.loadInitialData();
      } else {
        console.log('AppComponent: onAuthStateChanged - Aucun utilisateur authentifié.');
      }
    });
  }

  async loadInitialData() {
    this.loading = true;
    try {
      const [pointsControle, fermetures, fermetureCodeLibelle] = await Promise.all([
        firstValueFrom(this.storeService.pointsControle$),
        firstValueFrom(this.storeService.fermetures$),
        firstValueFrom(this.storeService.fermetureCodeLibelle$)
      ]);
      this.pointsControle = pointsControle;
      this.fermetures = fermetures;
      this.fermetureCodeLibelle = fermetureCodeLibelle;
      console.log('fermetureCodeLibelle:', this.fermetureCodeLibelle);

    } catch (error) {
      console.error('AppComponent: Erreur dans loadInitialData:', error);
      this.snackBar.open('Erreur lors du chargement des données initiales', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async login() {
    this.loading = true;
    try {
      await this.authService.login(this.loginData.email, this.loginData.password);
      this.snackBar.open('Connexion réussie', 'OK', { duration: 3000 });
    } catch (error) {
      console.error('AppComponent: Erreur de connexion:', error);
      this.snackBar.open('Erreur de connexion', 'OK', { duration: 3000 });
    }
    this.loading = false;
    this.currentStep = 1;
    this.resetSelections();
    this.resetIntervention();
    this.resetChoix();
  }
  async logout() {
    await this.authService .logout();
    this.resetApp();
  }
  previousStep() {
    this.currentStep--;
  }
    nextStep() {
    this.currentStep++;
    this.updateChoix();
  }
  updateChoix() {
  //  this.choix.etat = this.selectedStatut;
    this.choix.typeObjet = this.selectedTypeObjet;
  }
  async onFermetureChange() {
    //this.selectedFermeture = this.fermetures.find(f => f.id === this.selectedFermetureId) || null;
    try {
      this.storeService.actionLog(this.selectedFermetureId+'$_fermetureChange');
    } catch (e) {
      console.error(`Error logging attempt:`, e);
    }
    this.choix.fermeture = this.selectedFermetureId;
    console.log('onFermetureChange - Fermeture sélectionnée:', this.selectedFermetureId);
    this.loading = true;
    try {
      this.datesPrevisionnelles = await this.storeService.getDatesPrevisionnelles(this.selectedFermetureId);
      this.datesPrevisionnelles = [...new Set(this.datesPrevisionnelles)];
      console.log('onFermetureChange - Dates prévisionnelles:', this.datesPrevisionnelles);

      this.currentStep = 2;
    } catch (error) {
      this.snackBar.open('Erreur lors du chargement des dates', 'OK', { duration: 3000 });
    }
    this.loading = false;
  }

  async onSelectedDate(date: string) {
    this.selectedDate = date;
    this.choix.datePrevisionnelle = date;
    this.otFiDisponibles= await this.storeService.getOTDisponibles(this.selectedFermetureId ,date);
    if (this.otFiDisponibles.length === 0) {
      this.snackBar.open('Aucun OT disponible pour cette date', 'OK', { duration: 3000 });
      return;
    }
    try {
      // Use a Map to ensure uniqueness based on a composite key of otPereId and niveau.
      const otPereMap = new Map<string, {otPere: string, niveau: string}>();
      this.otFiDisponibles.forEach(ot => {
        const key = `${ot.otPereId}|${ot.niveau}`;
        if (!otPereMap.has(key)) {
          otPereMap.set(key, { otPere: ot.otPereId, niveau: ot.niveau });
        }
      });
      this.otPereDisponibles = Array.from(otPereMap.values());
    } catch (error) {
      this.snackBar.open('Erreur lors du chargement des niveaux disponibles', 'OK', { duration: 3000 });
    }
    this.currentStep = 3;
    console.log('AppComponent: onSelectedDate - OT disponibles:', this.otPereDisponibles);

  }
roundToNearestSecond(date: Date): Date   {
  const milliseconds = date.getTime();
  const roundedSeconds = Math.round(milliseconds / 1000);
  const roundedMilliseconds = roundedSeconds * 1000;
  return new Date(roundedMilliseconds);
}

selectOtPere(otPere: any) {
    this.selectedOtPere = otPere;
    this.choix.selectedNiveau = otPere.niveau;
        if (!this.selectedOtPere) {
      this.snackBar.open('Veuillez sélectionner une prestation', 'OK', { duration: 3000 });
      this.currentStep = 2;
      return;
    }
     this.currentStep = 4;
}


selectTypeObject(obj:string) {
  this.selectedTypeObjet = obj;
  this.choix.typeObjet = obj;
  if (!this.selectedTypeObjet) {
    this.snackBar.open('Veuillez sélectionner un type d\'objet  ', 'OK', { duration: 3000 });
    this.currentStep = 3;
    return;
  }
    try {
      this.objetsDisponibles = this.otFiDisponibles.filter( ot =>
          ot.niveau === this.selectedOtPere.niveau &&
          ot.typeObjet === this.selectedTypeObjet)
          .map(ot =>( {'codeObjet':ot.codeObjet,'codeEx':ot.codeEx,'statutO':ot.statutF}))
          .filter((obj, index, self) =>
            index === self.findIndex(o => o.codeObjet === obj.codeObjet)
          );
      if (this.objetsDisponibles.length === 0) {
        this.snackBar.open('Aucun objet disponible', 'OK', { duration: 3000 });
      }
      console.log('ObjetsDisponibles :', this.objetsDisponibles);
      this.currentStep = 5;
      this.updateChoix();
    } catch (error) {
      this.snackBar.open('Erreur lors du chargement des objets', 'OK', { duration: 3000 });
    }
  }
  genererDate() {
    const date=new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const H = date.getHours().toString().padStart(2, '0');
    const M = date.getMinutes().toString().padStart(2, '0');
    const S = date.getSeconds().toString().padStart(2, '0');
    return `${y}-${m}-${d}-${H}-${M}-${S}`;
}

  selectObjet(objet: ObjetIN) {
    this.selectedObjet = objet;
    this.choix.objetSelectionne = objet;
    const currentOT= this.otFiDisponibles.find(ot =>(
      ot.codeObjet === this.selectedObjet?.codeObjet &&
      ot.niveau === this.selectedOtPere.niveau ));
      this.currentOT = currentOT || null;
      if (!this.currentOT) {
       this.snackBar.open('Aucun OT trouvé pour ce niveau', 'OK', { duration: 2000 });
       return;
     }
    const dateControl = this.genererDate() ;
    if (currentOT) {
      console.log('currentOT:', currentOT);
      console.log('selectObjet: this.pointsControle:', this.pointsControle);
      const uniqueFilteredPCs = structuredClone(this.pointsControle).filter(
        pc => (pc.niveau === currentOT.niveau) &&
        (pc.typeObjet === currentOT.typeObjet)
      ).filter((pc, index, self) =>  index === self.findIndex(o => o.codePC === pc.codePC));
      // Create a deep copy to prevent modifying the original objects in pointsControle
      this.filteredPointsControle = uniqueFilteredPCs.map(pc => ({ ...pc }));
      this.reponses = uniqueFilteredPCs.map(pc => ({
        codePC: pc.codePC,
        codeRC: '',
        commentaire: '',
        horodate: dateControl
      }));
      console.log('selectObjet: Points de contrôle filtrés:', this.filteredPointsControle);
      this.currentStep = 6;
      if (this.filteredPointsControle.length === 0) {
        this.snackBar.open('Aucun point de contrôle trouvé pour ce niveau', 'OK', { duration: 3000 });
        return;
      }
      // Initialiser le rapport
      this.currentRapport = {
        codeOT: currentOT.id,
        intervenantNom: this.currentUser.email,
        codeObjet: currentOT.codeObjet,
        niveau: currentOT.niveau,
        reponses: [],
        dateCreation: dateControl,
        statutR: 'brouillon'
      };
    }
  }
  getStatutColor(statut: string): string {
    switch (statut) {
      case 'Commandé': return 'warn';
      case 'Terminé': return 'accent';
      default: return '';
    }
  }

    traitePoinC(pointC: PointControle) {
      if (!pointC) {
        this.snackBar.open('Veuillez sélectionner un point de contrôle', 'OK', { duration: 3000 });
        return;}
      this.currentStep = 7;
      this.currentControl = pointC;
      this.currentResponse = this.reponses.find(r => r.codePC === pointC.codePC) || null ;
      this.nonVideResponse = this.currentResponse? this.currentResponse:this.nonVideResponse;
      console.log('traitePoinC - currentControl:', this.currentControl);
      this.optionsResponse = this.getOptionsResponse();
      if (this.optionsResponse.length === 0) {
        this.snackBar.open('Aucune réponse trouvée pour ce point de contrôle', 'OK', { duration: 3000 });
        return;
      }
      this.selectedResponseCtr = this.optionsResponse[0];
      console.log('traitePoinC - optionsResponse:', this.optionsResponse);
    }
  getOptionsResponse(): PointControle[] {
    if (!this.currentControl) return [];
    const repC= this.pointsControle.filter(pc =>
      pc.codePC === this.currentControl!.codePC &&
      pc.niveau === this.currentOT!.niveau
    );
    if (repC.length === 0) {
      this.snackBar.open('Aucune réponse trouvée pour ce point de réponse', 'OK', { duration: 3000 });
      return [];
    }
    const currentResponse = this.reponses.find(r => r.codePC === this.currentControl!.codePC);
    const pointR = repC.find(r => r.codeRC === currentResponse!.codeRC) || repC[0];
    const result=[pointR,...repC.filter(r => r.codeRC !== pointR.codeRC)];
    return result as PointControle[];
  }

  retourListeControl(){
    this.currentStep = 6;
    this.snackBar.open('Saisie du point de contrôle abandonnée', 'OK', { duration: 3000 });
    this.currentControl = null;
  }
  enregistreControl() {
    this.currentStep = 6;
    this.currentResponse = this.nonVideResponse;
    this.currentResponse.codeRC = this.selectedResponseCtr!.codeRC ;
    this.currentResponse.horodate = this.genererDate();
    console.log('retourListeControl - currentControl:', this.currentControl);
      console.log('this.nonVideResponse:', this.nonVideResponse);
    console.log(' this.reponses:', this.reponses);
    if (this.currentResponse) {
      this.reponses = [
        ...this.reponses.filter(r => r.codePC !== this.currentResponse!.codePC),
        this.currentResponse
      ];
      this.currentControl!.statutC='pleinC' ;
      this.filteredPointsControle = [...this.filteredPointsControle.filter(pc => pc.codePC !== this.currentControl!.codePC),
        this.currentControl!];
      this.tousPCRenseignes= this.filteredPointsControle.every(pc => pc.statutC === 'pleinC');
      console.log('enregistreControl - this.filteredPointsControle:', this.filteredPointsControle);
      console.log('enregistreControl - tousPCRenseignes:', this.tousPCRenseignes);
      this.currentControl = null;

    }
}

  isCurrentControlValid(): boolean {
    if (!this.currentResponse?.codeRC) return false;
    if (this.currentControl!.commentaireObligatoire && !this.currentResponse?.commentaire.trim()) return false;
    return true;
  }

  async envoiRapport() {
    if (!this.currentRapport || !this.currentOT|| !this.tousPCRenseignes) return;
    this.loading = true;
    try {
      this.currentRapport.statutR = 'valide';
      this.currentRapport.reponses = this.reponses;
      const rapportId = await this.storeService.saveRapport(this.currentRapport);
     } catch (error) {
      this.snackBar.open('Erreur saveRapport', 'OK', { duration: 3000 });
    }
    try {
      // Marquer l'OT comme terminé
      await this.storeService.updateOTStatut(this.currentOT.id, 'Terminé');
      this.otFiDisponibles = [...this.otFiDisponibles.filter(ot => ot.id !== this.currentOT!.id),
        { ...this.currentOT!, statutF: 'Terminé' } ];

      this.snackBar.open('Intervention validée et transmise avec succès!', 'OK', { duration: 5000 });
      this.resetIntervention();

    } catch (error) {
      this.snackBar.open('Erreur lors de la validation', 'OK', { duration: 3000 });
    }
    this.loading = false;
    this.selectedObjet = null;
    this.selectedNiveau = '';
    this.tousPCRenseignes = false;
    this.filteredPointsControle = [];
    this.currentStep = 3;
  }
  goBack() {
    this.currentStep = 1;
    this.resetSelections();
  }

  goBackToControls() {
    this.currentStep = 3;
  }

  resetIntervention() {
    this.currentStep = 2;
    this.currentOT = null;
    this.currentRapport = null;
    this.currentControl = null;
  }

    hasChoix(): boolean {
    return Object.keys(this.choix).length > 0;
  }
  resetChoix() {
    this.choix = {};
    this.currentStep = 1;
    this.resetSelections();
  }
  resetSelections() {
    this.selectedFermetureId = '';
    this.selectedFermeture = null;
  }

  resetApp() {
    this.currentStep = 1;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.resetSelections();
    this.resetIntervention();
  }

  async testStore(){
    console.log('testStore - Fonction de test de stockage appelée');

    this.storeService.saveString('test,1,2,3,4,5').then((path) => {
      console.log('Fichier stocké à:', path);
      this.snackBar.open('Fichier stocké avec succès: ' + path, 'Fermer', { duration: 5000 });
    }).catch((error) => {
      console.error('Erreur lors du stockage du fichier:', error);
      this.snackBar.open('Erreur lors du stockage du fichier: ' + error.message, 'Fermer', { duration: 5000 });
    } );
    console.log('testStore - Fonction de test de stockage appelée');
  }

}
