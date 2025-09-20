import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StoreService } from '../../../services/store.service';
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { AuthService } from '../../../services/auth.service';
import * as Papa from 'papaparse';

interface ValidationResult {
  isValid: boolean;
  message: string;
  missingHeaders?: string[];
}

@Component({
  selector: 'app-comp-detail-d',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './comp-detail-d.component.html',
  styleUrl: './comp-detail-d.component.scss'
})
export class CompDetailDComponent {
  private storeService = inject(StoreService);
  private authservice = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  user$ = this.authservice.getCurrentUser();
  fileName: string | null = null;
  isProcessing = false;
  isUpdating = false;
  validationResult: ValidationResult | null = null;
  private parsedData: any[] = [];
  private readonly REQUIRED_HEADERS = [
    "N° d'OT","Équipement","OT père","Nb d'OT fils","Date de début prévue","Date de création","Intervention","Créateur"
  ];
  private readonly Map_HEADERS = {
    "N° d'OT":"noOt","Équipement":"equipement","OT père":"otPere","Nb d'OT fils":"nbOtFils",
    "Date de début prévue":"dateDebutPrevue","Date de création":"dateCreation",
    "Intervention":"intervention","Créateur":"createur"  
  };
  otspere:any[]=[];
  otsfils:any[]=[];
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

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.fileName = file.name;
    this.isProcessing = true;
    this.validationResult = null;
    this.parsedData = [];
    if (file.size === 0) {
      this.validationResult = { isValid: false, message: 'Le fichier est vide.' };
      this.isProcessing = false;
      return;
    }
    const storage = getStorage(); // Initialize Firebase Storage
    let userEmail = 'email_inconnu';
    await this.authservice.getCurrentUser().subscribe(user => {
      console.log('Current user:', user);
      if (user && user.email) {
        userEmail = user.email.replace(/[@.]/g, '_'); // Sanitize email for file path
      }
    });
    const storageRef = ref(storage, `charge_OT/${file.name}_${this.genererDate()}_${userEmail}`); // Path in Firebase Storage
    uploadBytes(storageRef, file)
      .then(() => {
        console.log('File uploaded successfully to Firebase Storage.');
        this.snackBar.open('Fichier téléchargé avec succès.', 'OK', { duration: 5000 });
      })
      .catch((error) => {
        console.error('Error uploading file to Firebase Storage:', error);
        this.snackBar.open('Erreur lors du téléchargement du fichier.', 'Fermer', { duration: 5000 });
      })
      .finally(() => {
        this.isProcessing = false;
      });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        this.validateCsv(result.data, result.meta.fields || []);
        this.isProcessing = false;
      },
      error: (error) => {
        this.validationResult = { isValid: false, message: `Erreur lors de l'analyse du CSV: ${error.message}` };
        this.isProcessing = false;
      }
    });
  }

  private validateCsv(data: any[], headers: string[]): void {
    const missingHeaders = this.REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      console.log('Missing headers:', missingHeaders);
      this.validationResult = { isValid: false, message: 'Le fichier CSV ne contient pas les colonnes requises.', missingHeaders };
      return;
    }
    if (data.length === 0) {
      this.validationResult = { isValid: false, message: 'Le fichier CSV ne contient aucune ligne de données.' };
      return;
    }
    this.validationResult = { isValid: true, message: `Fichier analysé avec succès. ${data.length} ligne(s) de données trouvée(s).` };
    this.parsedData = data.map(row => {
      const newRow: { [key: string]: any } = {};
      for (const [originalHeader, newHeaderName] of Object.entries(this.Map_HEADERS)) {
        if (row.hasOwnProperty(originalHeader)) {
          newRow[newHeaderName] = row[originalHeader];
        }
      }
      return newRow;
    }).filter(row => {
      const pattern = new RegExp('001[3-7]-PREV|GAM_001[3-7]_0089');
        return pattern.test(row['intervention']);
      } );  
  } ;
  
  transdate(date: string):string {
    const annee=date.slice(6,10);
    const mois=date.slice(3,5);
    const jour=date.slice(0,2);
    return `${annee}-${mois}-${jour}`;
      }
  gam2Niveau(gam:string):string {
    if(gam.slice(6,8)==='13') return 'Bimestrielle de jour';
    if(gam.slice(6,8)==='14') return 'Bimestrielle de nuit';
    if(gam.slice(6,8)==='16') return 'Maintenance annuelle';
    return 'horsChamp';
  }
  
  async chargeOtPere(): Promise<void> {
    const dataPere=this.parsedData.filter(item=>item.otPere==='');
    const otspere = await Promise.all(dataPere.map(async (item) => {
      const otpere=await {
        "datePrevisionnelle":this.transdate(item.dateDebutPrevue),
        "fermetureId": await this.storeService.gamme2Fermeture(item.intervention),
        "id":item.noOt,
        "statutP":"Commandé",
        "createur":item.createur,
        "niveau":this.gam2Niveau(item.intervention),
        "dateCreation":this.transdate(item.dateCreation)
      }
      return otpere;
    }));
    this.otspere=otspere;
    console.log('this.otspere',this.otspere);
    await this.storeService.chargeOtPere(otspere);
  } 

  async chargeOtFils(): Promise<void> {
    console.log('chargeOtFils, parsedData:',this.parsedData);
    const dataFils=this.parsedData.filter(item=>item.otPere!=='');
    console.log('dataFils',dataFils);
    const otsfilsPromises = dataFils.map(async (item) => {
      const otpere=this.otspere.find(x => x.id === item.otPere);
      console.log('otpere',item.otPere,this.otspere);
      if(!otpere) {
        console.warn(`OT père avec id ${item.otPere} non trouvé pour l'OT fils ${item.noOt}. Cet OT fils sera ignoré.`);
        return null;
      }
      return {
        "datePrevisionnelle":otpere.datePrevisionnelle,
        "fermetureId": otpere.fermetureId,
        "id":item.noOt,
        "otPereId":item.otPere,
        "statutF":"A faire",
        "niveau":otpere.niveau,
        "codeObjet":item.equipement,
        "codeEx": await this.storeService.tatouage2codeEx(item.equipement),
        "typeObjet":(await this.storeService.tatouage2codeEx(item.equipement)).slice(0,2)=='IS'? "issue":'niche'
      };
    });

    const resolvedOtsFils = await Promise.all(otsfilsPromises);
    // Filtrer les éléments nuls qui résultent d'un OT père non trouvé
    const validOtsFils = resolvedOtsFils.filter(Boolean);

    this.otsfils = validOtsFils as any[];
    console.log('this.otsfils',this.otsfils);
    if (this.otsfils.length > 0) {
      await this.storeService.chargeOtFils(this.otsfils);
    }
  } 


  async chargeOT(): Promise<void> {
    if (!this.validationResult?.isValid || this.parsedData.length === 0) {
      console.log('ChargeOT, données non valides ou absentes.');
      return;
    }
    this.isUpdating = true;
    try {
      await this.chargeOtPere();
      await this.chargeOtFils();
      this.snackBar.open('Les OTs ont été chargées avec succès.', 'OK', { duration: 5000 });
      this.fileName = null;
      this.validationResult = null;
      this.parsedData = [];
    } catch (error) {
      console.error("Erreur lors du chargement des OTs :", error);
      this.snackBar.open('Une erreur est survenue lors du chargement des OTs.', 'Fermer', { duration: 5000 });
    } finally {
      this.isUpdating = false;
    }
  }
}