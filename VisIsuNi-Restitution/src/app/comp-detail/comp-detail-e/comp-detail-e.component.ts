import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StoreService } from '../../../services/store.service';
import * as Papa from 'papaparse';
interface ValidationResult {
  isValid: boolean;
  message: string;
  missingHeaders?: string[];
}
@Component({
  selector: 'app-comp-detail-e',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './comp-detail-e.component.html',
  styleUrl: './comp-detail-e.component.scss'
})
export class CompDetailEComponent {
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  fileName: string | null = null;
  isProcessing = false;
  isUpdating = false;
  validationResult: ValidationResult | null = null;
  private parsedData: any[] = [];
  private readonly REQUIRED_HEADERS = ['codePC', 'descPC', 'codeRC', 'descRC', 'typeObjet', 'niveau', 'commentaireObligatoire', 'Gravité'  ];

  onFileSelected(event: Event): void {
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
    const headerslen =  headers.map(h => h.trim().length);
    if (Math.min(...headerslen) === 0 ) {
      this.validationResult = { isValid: false, message: 'Le fichier CSV contient des en-têtes vides. Veuillez vérifier le format du fichier.' };
      return;
    }
    const missingHeaders = this.REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      this.validationResult = { isValid: false, message: 'Le fichier CSV ne contient pas les colonnes requises.', missingHeaders };
      return;
    }
    if (data.length === 0) {
      this.validationResult = { isValid: false, message: 'Le fichier CSV ne contient aucune ligne de données.' };
      return;
    }
    this.validationResult = { isValid: true, message: `Fichier analysé avec succès. ${data.length} ligne(s) de données trouvée(s).` };
    this.parsedData = data;
  }
  async updateConfiguration(): Promise<void> {
    if (!this.validationResult?.isValid || this.parsedData.length === 0) return;
    this.isUpdating = true;
    try {
      await this.storeService.updatePointsControleConfig(this.parsedData);
      this.snackBar.open('La configuration a été mise à jour avec succès.', 'OK', { duration: 5000 });
      this.fileName = null;
      this.validationResult = null;
      this.parsedData = [];
    } catch (error) {
      this.snackBar.open('Une erreur est survenue lors de la mise à jour.', 'Fermer', { duration: 5000 });
    } finally {
      this.isUpdating = false;
    }
  }
}