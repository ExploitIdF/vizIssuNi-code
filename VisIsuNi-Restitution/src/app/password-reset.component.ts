import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="reset-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Réinitialiser le mot de passe</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="instructions">
            Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          <form (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="Ex: pat@example.com">
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="isSubmitting">
              {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien' }}
            </button>
          </form>
          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/login">Retour à la connexion</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-container {
      max-width: 400px;
      margin: 40px auto;
    }
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    mat-card-title {
      text-align: center;
      font-size: 1.8em;
      margin-bottom: 20px;
    }
    .instructions {
      text-align: center;
      margin-bottom: 20px;
      color: #555;
    }
    mat-card-actions {
      padding: 16px;
      margin-top: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .error-message {
      color: #f33;
      text-align: center;
      margin-top: 15px;
      padding: 8px;
      background-color: rgba(244, 67, 54, 0.2);
      border-radius: 4px;
    }
  `]
})
export class PasswordResetComponent {
  email: string = '';
  errorMessage: string = '';
  isSubmitting = false;
  private authService: AuthService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  async onSubmit() {
    if (!this.email) {
      this.errorMessage = "Veuillez entrer une adresse e-mail.";
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      await this.authService.sendPasswordResetEmail(this.email);
      this.snackBar.open("Un e-mail de réinitialisation a été envoyé.  Veuillez consulter votre boîte de réception. Si vous ne trouvez pas le mail vérifiez s'il est dans les Spams", 'Fermer', {
        duration: 5000,
      });
    } catch (error: any) {
      this.errorMessage = this.getFriendlyErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private getFriendlyErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/invalid-email':
        return "L'adresse e-mail n'est pas valide.";
      case 'auth/user-not-found':
        return 'Aucun utilisateur trouvé avec cette adresse e-mail.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer plus tard.';
    }
  }
}
