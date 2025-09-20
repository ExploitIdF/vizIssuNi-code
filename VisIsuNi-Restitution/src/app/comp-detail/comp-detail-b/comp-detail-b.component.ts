import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { StoreService } from '../../../services/store.service';
import { AuthService } from '../../../services/auth.service';
import { Observable, take } from 'rxjs';
import { PointControle } from '../../types';

@Component({
  selector: 'app-comp-detail-b',
  imports: [CommonModule, FormsModule, MatTableModule, MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './comp-detail-b.component.html',
  styleUrl: './comp-detail-b.component.scss'
})
export class CompDetailBComponent   {
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
    this.fermetures$ = this.storeService.getFermetures();
    // Accès à la variable partagée depuis le service
    this.pointsControle$ = this.storeService.pointsControle$;
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
            let col = '';
            if (ot.statutP=='Commandé'){
              if (ot.niveau =='annuel') {col= '#faa';}
              else if (ot.niveau=='bimestriel'){ col= '#afa';}
              else { col= '#aaf'; }
            }
            else { col= '#555';}
            return { date: ot.datePrevisionnelle, color: col, id: ot.id,  niveau: ot.niveau};
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
       // console.log('OT Fils:', this.otFils);
      },
      error: error => {
        console.error('Erreur lors de la récupération des OT fils:', error);
        this.isLoadingOtFils = false;
        this.otFils = []; // Vider les OT fils en cas d'erreur
      }
    });
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
