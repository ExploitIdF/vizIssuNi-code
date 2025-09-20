import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take, switchMap, of, catchError, map } from 'rxjs';
import { NavbarComponent } from './navbar/navbar.component'; // Importer NavbarComponent

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent], // Ajouter NavbarComponent aux imports
  template: '<app-navbar></app-navbar><router-outlet></router-outlet>',
  styles: [
    `
      :host {
        max-width: 1500px; /* Limite la largeur maximale */
        min-height: 100vh; /* Assure que l'app prend au moins toute la hauteur de l'écran */
        margin: 0 auto;
        display: flex; /* Utilise flexbox pour un meilleur contrôle de la disposition */
        flex-direction: column; /* Aligne les enfants (navbar, router-outlet) verticalement */
        background-color: #ffc; /* Couleur de fond pour l'ensemble de l'application */
      }
    `
  ]
})
export class AppComponent implements OnInit {
  private authService: AuthService = inject(AuthService);
  ngOnInit(): void {
    this.authService.getCurrentUser().pipe(
      take(1), 
      switchMap(user => {
        if (!user) {
          console.log('AppComponent: Aucun utilisateur initial, tentative de connexion anonyme.');
          return this.authService.signInAnonymously().pipe(
            map(anonUser => {
              console.log('AppComponent: Connexion anonyme réussie.', anonUser.uid);
              return anonUser; // Retourne l'utilisateur anonyme
            }),
            catchError(error => {
              console.error('AppComponent: Échec de la connexion anonyme à l\'initialisation.', error);
              return of(null); // Gère l'erreur pour ne pas casser le flux
            })
          );
        };
        console.log('AppComponent: Utilisateur initial trouvé.', user.uid, 'isAnonymous:', user.isAnonymous);
        return of(user); 
      })
    ).subscribe();
  }
}