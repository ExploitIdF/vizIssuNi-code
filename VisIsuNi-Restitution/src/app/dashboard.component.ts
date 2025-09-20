import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, firstValueFrom, switchMap, of, from, startWith } from 'rxjs'; 
import { MatCardModule } from '@angular/material/card'; // Garder MatCardModule
import { MatButtonModule } from '@angular/material/button'; // Peut être retiré si plus de boutons
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '@angular/fire/auth';

interface DashboardUserState {
  // isLoggedIn: boolean;    // Géré par la navbar
  // isAnonymous: boolean;   // Géré par la navbar
  email: string | null;   // Email de l'utilisateur (si non anonyme)
  displayName: string | null; // Nom d'affichage (si disponible)
}
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatProgressSpinnerModule], // MatButtonModule peut être retiré
  template: `
    <div class="dashboard-container">
      @if (currentUserState$ | async; as state) {
          @if (state.email) {
            <div class="grid-container">
              <mat-card *ngFor="let item of items" 
                class="clickable-card" 
              (click)="redirectTo( item.id)" >
                <mat-card-header>
                  <mat-card-title>{{item.title}}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>{{item.description}}</p>
                </mat-card-content>
              </mat-card>
              @if (isAdmin$ | async) {
                <mat-card *ngFor="let item of itemAs" 
                  class="clickable-card admin-card"
                (click)="redirectTo( item.id)" >
                  <mat-card-header>
                    <mat-card-title>{{item.title}}</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <p>{{item.description}}</p>
                  </mat-card-content>
                </mat-card>
              }
            </div>       
          } @else {
            <p>Bienvenue sur le tableau de bord !</p>
            <p>Pour plus de fonctionnalités, <a routerLink="/login">connectez-vous</a> ou <a routerLink="/register">créez un compte</a>.</p>
          }
      }
      @else {
        <!-- État initial pendant le chargement -->
        <div class="loading-message">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Chargement des informations utilisateur...</p>
        </div>
      }
    </div>
  `, 
  styles: [`
    .dashboard-container {
      max-width: 700px;
      margin: 20px auto;
      text-align: center;
      color: #335;
    }

    mat-card-title {
      font-size: 1.8em;
      margin-bottom: 20px;
    }

    .loading-message p {
      font-size: 1.1em;
      margin-bottom: 10px;
    }
  
    .loading-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 150px;
    }

    .loading-message p {
      margin-top: 20px;
    }

    .grid-container {
      display: grid;
      /* Crée 3 colonnes de taille égale */
      grid-template-columns: repeat(3, 1fr); 
      /* Définit l'espace entre les lignes et les colonnes */
      gap: 20px; 
      padding: 20px;
    }

    .clickable-card {
      cursor: pointer;
      transition: box-shadow 0.2s ease-in-out;
      background-color: #fdd;
    }

    .clickable-card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .admin-card {
      background-color: #e3f2fd; /* Un bleu clair pour la distinguer */
      border: 1px solid #90caf9;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUserState$!: Observable<DashboardUserState>;
  isAdmin$: Observable<boolean> = of(false);
  items = [
     { title: 'Calendrier des interventions', 
      description: 'Dates des interventions commandées. Permet de visualiser, par fermetures, la régularité des interventions.', 
      id: "/calendrier" },
     { title: "Afficher les rapports d'intervention", 
      description: "Choisir la fermeture, la date prévisionnelle et le type d'intervention.", 
      id: "/detailA" 
    },
    { title: 'Points de Contrôle', description: 'Pour consulter le détail des points de contrôle', id: "/detailB" },
//    { title: 'Ajout d\'une prestation', description: 'Pour ajouter une prestation, sans passer par CosWin.', id: "F" }
  ];
  itemAs = [
   { title: 'Chargement OT', description: 'Charger dans l\'application les dernières OT créées dans CosWin', id: "/detailD" },
      { title: 'Mise à jour des points de contrôle', description: 'Charger dans l\'application un nouveau fichier de points de contrôle', id: "/detailE" },
  ];
  constructor(private authService: AuthService, private router: Router) {}
  ngOnInit(): void {
    const currentUser$ = this.authService.getCurrentUser();
    this.currentUserState$ = currentUser$.pipe(
      map(user => {
        if (user) {
          return {
            isLoggedIn: true,
            isAnonymous: user.isAnonymous,
            email: user.isAnonymous ? null : (user.email || null),
            displayName: user.displayName || null
          };
        } else {
          return {
            email: null,
            displayName: null
          };
        }
      })
    );
    this.isAdmin$ = currentUser$.pipe(
      switchMap(user => {
        if (user && user.email && (
          user.email =='olivier.nalin@gmail.com'  || 
          user.email =='fanny.baraud-cooper@developpement-durable.gouv.fr' ||
          user.email =='nicolas.bernard@developpement-durable.gouv.fr' ||
          user.email =='villard.libelle@developpement-durable.gouv.fr' ||
          user.email =='arnaud.iffly@developpement-durable.gouv.fr' 
        )) {
          return from(this.authService.isAdmin(user.email));
        }
        return of(false);
      }),
      startWith(false)
    );
  }
  redirectTo(path: string) {
    this.router.navigate([path]);
  }
}