
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule,Router, CanActivateFn  } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // Optionnel, pour une icône
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,    FormsModule,    RouterModule,    MatCardModule,    MatFormFieldModule,
    MatInputModule,    MatButtonModule,  MatIconModule,MatSnackBarModule // Optionnel
  ],
  template: `
    <div class="login-container">
      <mat-card *ngIf="!demandeNouveauMotDePasse">
        <mat-card-header>
          <mat-card-title>🔐 Authentification Intervenant</mat-card-title>
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
                placeholder="Ex: pat@example.com">
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
                required>
              <mat-icon matSuffix>lock</mat-icon>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="full-width">Se connecter</button>
          </form>
          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
        </mat-card-content>
         <mat-card-actions>
          <a mat-button (click)="versMotOubli()" >Mot de passe oublié ?</a>
        </mat-card-actions>
      </mat-card>
      <mat-card *ngIf="demandeNouveauMotDePasse">
          <mat-card-header>
          <mat-card-title>Réinitialiser le mot de passe</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="instructions">
            Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          <form (ngSubmit)="onSubmitNouv()">
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
    .login-container {
      max-width: 400px;
      margin: 40px auto;
    }
    .full-width {
      width: 100%;
      margin-bottom: 15px; /* Espace entre les champs */
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
      justify-content: space-between;
      align-items: center;
    }
    .error-message {
      color: #f33; /* Couleur d'erreur Material */
      text-align: center;
      margin-top: 15px;
      padding: 8px;
      background-color: rgba(244, 67, 54, 0.2);
      border-radius: 4px;
    }
  `]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  demandeNouveauMotDePasse: boolean = false;
  isSubmitting = false;
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private snackBar = inject(MatSnackBar);
  async onSubmit() {
    try {
      const user = await this.authService.login(this.email, this.password);
      console.log('Connexion réussie', user);
    } catch (error: any) {
      // this.errorMessage = error.message; // Ancienne méthode
      this.errorMessage = this.getFriendlyErrorMessage(error);
    }
  }
  versMotOubli() {
    this.demandeNouveauMotDePasse = true;
  } 

  async onSubmitNouv() {
    if (!this.email) {
      this.errorMessage = "Veuillez entrer une adresse e-mail.";
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      await this.authService.sendPasswordResetEmail(this.email);
      this.demandeNouveauMotDePasse = false; // Retour à la page de connexion
      this.snackBar.open("Un e-mail de réinitialisation a été envoyé.  Veuillez consulter votre boîte de réception. Si vous ne trouvez pas le mail vérifiez s'il est dans les Spams", 'Fermer', {
        duration: 5000,
      });
    } catch (error: any) {
      this.errorMessage = this.getFriendlyErrorMessage(error)+error.message ;
    } finally {
      this.isSubmitting = false;
    }
  }

  private getFriendlyErrorMessage(error: any): string {
    console.error('Login error code:', error.code); // Loggez le code pour débogage
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential': // Souvent retourné pour email/mot de passe incorrect au lieu de user-not-found
        return 'L\'adresse e-mail ou le mot de passe est incorrect. Veuillez réessayer.';
      case 'auth/wrong-password': // Peut encore apparaître dans certains cas
        return 'Mot de passe incorrect. Veuillez réessayer.';
      case 'auth/invalid-email':
        return 'L\'adresse e-mail n\'est pas valide.';
      case 'auth/user-disabled':
        return 'Ce compte utilisateur a été désactivé.';
      default:
        return 'Une erreur inconnue est survenue lors de la connexion. Veuillez réessayer plus tard.';
    }
  }
}
