import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-registration',
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
  ],
  template: `
    <div class="registration-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Inscription</mat-card-title>
        </mat-card-header>
        <mat-card-content>
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
                placeholder="Ex: jean.dupont@example.com"
              />
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input
                matInput
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                required
              />
              <mat-icon matSuffix>lock</mat-icon>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" class="full-width">
              S'inscrire
            </button>
          </form>
          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button color="accent" routerLink="/login">Déjà un compte ? Se connecter</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .registration-container {
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
      mat-card-actions {
        padding: 16px;
        margin-top: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .error-message {
        color: #f44336; /* Couleur d'erreur Material */
        text-align: center;
        margin-top: 15px;
        padding: 8px;
        background-color: rgba(244, 67, 54, 0.1);
        border-radius: 4px;
      }
    `,
  ],
})
export class RegistrationComponent {
  email = '';
  password = '';
  errorMessage = '';
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  async onSubmit() {
    try {
      const user = await this.authService.register(
        this.email,
        this.password
      );
      console.log('Inscription réussie', user);
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.log('Erreur lors de l\'inscription:', error);
      this.errorMessage = this.getFriendlyErrorMessage(error);
    }
  }

  private getFriendlyErrorMessage(error: any): string {
    console.error('Registration error code:', error.code, error.message); // Loggez le code et message pour débogage
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      case 'auth/invalid-email':
        return 'L\'adresse e-mail n\'est pas valide.';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.';
      case 'auth/email-not-authorized': // Code personnalisé de votre AuthService
        return 'Vous n\'êtes pas identifié comme potentiel utilisateur de ce service.';
      // Ajoutez d'autres cas spécifiques à l'inscription si nécessaire
      default:
        return 'Une erreur inconnue est survenue lors de l\'inscription. Veuillez réessayer plus tard.';
    }
  }
}