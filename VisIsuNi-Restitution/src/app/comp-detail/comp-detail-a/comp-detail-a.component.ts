import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { StoreService } from '../../../services/store.service';
import { AuthService } from '../../../services/auth.service';
import { Observable, take,map } from 'rxjs';
import { PointControle } from '../../types';

@Component({
  selector: 'app-comp-detail-a',
  imports: [CommonModule, FormsModule, MatTableModule, MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './comp-detail-a.component.html',
  styleUrl: './comp-detail-a.component.scss'
})
export class CompDetailAComponent implements OnInit {
  fermetures$: Observable<any[]>;
  selectedFermeture!:any;
  otPeres: any[] = []; // Pour stocker les résultats de la recherche
  isLoadingOtPeres = false; // Pour afficher un indicateur de chargement
  datesCouleurs: { date: string, color: string,id: string, niveau: string }[] = [];
  selectedOtId: string | null = null;
  otFils: any[] = []; // Pour stocker les OT fils
  isLoadingOtFils = false;
  selectedOtFils: any | null = null;
  reponse: any | null = null; // Pour stocker le rapport d'intervention
  isLoadingReponse = false; // Pour le chargement du rapport
  displayedColumnsForOtFils: string[] = ['codeEx', 'codeObjet', 'id', 'statutF'];
  pointsControle$: Observable<PointControle[]>;

  constructor(private storeService: StoreService, private authService: AuthService) {
    this.fermetures$ = this.storeService.fermetures$;
    this.pointsControle$ = this.storeService.pointsControle$;
  }
  private pointsControleList: any[] = [];
  private fermeturesList: any[] = [];
  ngOnInit() {
    this.pointsControle$.pipe(take(1)).subscribe(points => {
      this.pointsControleList = points;
      console.log('init, pointsC:',this.pointsControleList);
    });
        this.fermetures$.pipe(take(1)).subscribe(points => {
      this.fermeturesList = points;
      console.log('init, fermetures:',this.fermeturesList);
    });
  }
  onFermetureChange(fermeture: any): void {
    this.selectedOtId = null;
    this.otFils = [];
    this.selectedOtFils = null;
    this.reponse = null;
    if (fermeture && fermeture.nom) {
      this.isLoadingOtPeres = true;
      this.otPeres = []; // Vider les anciens résultats
      this.storeService.getOtPeresByFermetureId(fermeture.nom).pipe(take(1)).subscribe({
        next: data => {
          this.otPeres = data;
          this.isLoadingOtPeres = false;
         // console.log('OT Pères:', this.otPeres);
         this.datesCouleurs = this.otPeres.map(ot => {
          let color = '#999'; // Default color
          if (ot.statutP === 'Commandé') {
            switch (ot.niveau) {
              case 'Maintenance annuelle':
                color = '#faa';
                break;
              case 'Bimestrielle de nuit':
                color = '#afa';
                break;
              default:
                color = '#aaf';
            }
          }
          return {
            date: ot.datePrevisionnelle,
            color: color,
            id: ot.id,
            niveau: ot.niveau
          };
        });
        //  console.log('Dates et couleurs:', this.datesCouleurs);
        }
      });
    } else {
      this.otPeres = []; // Vider si aucune fermeture n'est sélectionnée
      this.datesCouleurs = [];
      this.otFils = [];
      this.reponse = null;
    }
  }
  onOtPereClick(otId: string): void {
    if (this.selectedOtId === otId) {
      // Si le même OT est cliqué à nouveau, on le désélectionne
      this.selectedOtId = null;
      this.otFils = [];
      this.selectedOtFils = null;
      this.reponse = null;
      return;
    }
    this.selectedOtId = otId;
    this.isLoadingOtFils = true;
    this.otFils = [];
    this.selectedOtFils = null;
    this.reponse = null;
    this.storeService.getOtFilsByOtPereId(otId).pipe(take(1)).subscribe({
      next: data => {
        this.otFils = data;
        this.isLoadingOtFils = false;
       console.log('OT Fils:', this.otFils);
      },
      error: error => {
        console.error('Erreur lors de la récupération des OT fils:', error);
        this.isLoadingOtFils = false;
        this.otFils = []; // Vider les OT fils en cas d'erreur
      }
    });
  }
  getDescPC(codePC: string): string  {
    let rtr=this.pointsControleList.find(o => o.codePC === codePC)?.descPC;
    rtr= rtr? rtr : 'pasResultat';
  return rtr
  }
  getDescRC(codeRC: string): string  {
    let rtr=this.pointsControleList.find(o => o.codeRC === codeRC)?.descRC;
    rtr= rtr? rtr : 'pasRéponse';
  return rtr
  }
  
  onOtFilsRowClick(otFils: any): void {
    this.selectedOtFils = otFils;
    console.log('OT Fils sélectionné:', this.selectedOtFils);
    if (otFils && otFils.id) {
      this.isLoadingReponse = true;
      this.reponse = null;
      this.storeService.getReponseByOt(otFils.id).pipe(take(1)).subscribe({
        next: data => {
          this.reponse = data.length > 0 ? data[0] : null;
          const responsesA: any[] = [];
          if (this.reponse?.reponses?.length) {
            this.reponse.reponses.forEach((element: any) => {
              const desPc = this.getDescPC(element.codePC); 
              const desRc = this.getDescRC(element.codeRC); 
              responsesA.push({ ...element, descPC: desPc,descRC:desRc });
            });
            this.reponse.reponses=responsesA;
      }
          this.isLoadingReponse = false;
          console.log('Rapport d\'intervention:', this.reponse);
        },
        error: err => {
          console.error('Erreur lors de la récupération du rapport:', err);
          this.isLoadingReponse = false;
        }
      });
    }
  }
}
