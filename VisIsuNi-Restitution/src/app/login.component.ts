
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule, // Optionnel
  ],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Connexion</mat-card-title>
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
          <a mat-button routerLink="/password-reset">Mot de passe oublié ?</a>
          <a mat-button color="accent" routerLink="/register">Pas encore de compte ? S'inscrire</a>
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
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  async onSubmit() {
    try {
      const user = await this.authService.login(this.email, this.password);
      console.log('Connexion réussie', user);
      this.router.navigate(['/menu']);
    } catch (error: any) {
      // this.errorMessage = error.message; // Ancienne méthode
      this.errorMessage = this.getFriendlyErrorMessage(error);
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
