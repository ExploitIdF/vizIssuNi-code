import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, map, firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';

// Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu'; // Pour un menu déroulant utilisateur

interface NavbarUserState {
  isLoggedIn: boolean;
  isAnonymous: boolean;
  userEmail: string | null;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  userState$!: Observable<NavbarUserState>;
  logoutErrorMessage: string | null = null;
  ngOnInit(): void {
    this.userState$ = this.authService.getCurrentUser().pipe(
      map((user: User | null) => {
        this.logoutErrorMessage = null; // Réinitialiser le message d'erreur à chaque changement d'état
        if (user) {
          const email = user.email;
          return {
            isLoggedIn: true,
            isAnonymous: user.isAnonymous,
            userEmail: user.isAnonymous ? null : email
          };
        } else {
          // Devrait être rare si la connexion anonyme au démarrage fonctionne
          return {
            isLoggedIn: false,
            isAnonymous: false,
            userEmail: null
          };
        }
      })
    );
  }

  async logout(): Promise<void> {
    this.logoutErrorMessage = null;
    try {
      await firstValueFrom(this.authService.logout());
      // La redirection vers '/login' ou '/' sera gérée par le guard ou le composant de destination
      // après la mise à jour de l'état d'authentification.
      // Si une connexion anonyme automatique est en place, l'utilisateur pourrait être reconnecté anonymement.
      // On peut forcer une navigation si nécessaire :
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erreur lors de la déconnexion depuis la navbar:', error);
      this.logoutErrorMessage = 'Échec de la déconnexion. Veuillez réessayer.';
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
