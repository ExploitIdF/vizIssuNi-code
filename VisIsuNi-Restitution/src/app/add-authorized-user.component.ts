import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-add-authorized-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDialogModule // <-- Ajoutez MatDialogModule ici
  ],
  template: `
    <h2 mat-dialog-title>Ajouter un utilisateur autorisé</h2>
    <mat-dialog-content>
      <form [formGroup]="addUserForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email de l'utilisateur</mat-label>
          <input matInput formControlName="email" type="email" required placeholder="utilisateur@example.com">
          @if (addUserForm.get('email')?.hasError('required')) {
            <mat-error>L'email est requis.</mat-error>
          }
          @if (addUserForm.get('email')?.hasError('email')) {
            <mat-error>Veuillez entrer un email valide.</mat-error>
          }
        </mat-form-field>

        <mat-checkbox formControlName="isAdminRole" color="primary">
          Attribuer le rôle Administrateur
        </mat-checkbox>

        <div class="form-actions">
          <button mat-stroked-button (click)="onNoClick()">Annuler</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="addUserForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Ajout en cours...' : 'Ajouter' }}
          </button>
        </div>
         @if (errorMessage) {
          <p class="error-message">{{ errorMessage }}</p>
        }
      </form>
    </mat-dialog-content>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 15px; }
    .form-actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }
    .error-message { color: red; margin-top: 10px; text-align: center; }
    mat-checkbox { margin-bottom: 20px; }
  `]
})
export class AddAuthorizedUserComponent {
  addUserForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<AddAuthorizedUserComponent>);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.addUserForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      isAdminRole: [false]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  async onSubmit(): Promise<void> {
    if (this.addUserForm.invalid) {
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    const { email, isAdminRole } = this.addUserForm.value;
    const role = isAdminRole ? 'admin' : 'user';

    try {
      await this.authService.addAuthorizedUser(email, role);
      this.snackBar.open('Utilisateur autorisé ajouté avec succès !', 'Fermer', { duration: 3000 });
      this.dialogRef.close(true); // true indique que l'opération a réussi
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur autorisé:', error);
      this.errorMessage = error.message || 'Une erreur est survenue.';
    } finally {
      this.isSubmitting = false;
    }
  }
}