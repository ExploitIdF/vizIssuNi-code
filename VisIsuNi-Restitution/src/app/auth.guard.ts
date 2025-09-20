import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap, of, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state): ReturnType<CanActivateFn> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    take(1), // On ne prend que la première valeur pour éviter une souscription continue
    switchMap(user => {
      if (user && user.email && !user.isAnonymous) {
        return authService.isAdmin(user.email);
      }
      return of(false); // Pas d'utilisateur, anonyme, ou sans email => pas admin
    }),
    map(isAdmin => {
      if (isAdmin) return true;

      return router.createUrlTree(['/dashboard']); // Redirige les non-admins
    })
  );
};