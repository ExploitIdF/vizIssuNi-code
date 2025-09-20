
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { LoginComponent } from './login.component';
import { PasswordResetComponent } from './password-reset.component';
import { CompDetailAComponent } from './comp-detail/comp-detail-a/comp-detail-a.component'; 
import { CompDetailBComponent } from './comp-detail/comp-detail-b/comp-detail-b.component'; 
import { CalendrierComponent } from './comp-detail/calendrier/calendrier.component'; 
import { CompDetailDComponent } from './comp-detail/comp-detail-d/comp-detail-d.component';
import { CompDetailEComponent } from './comp-detail/comp-detail-e/comp-detail-e.component'; 
import { CompDetailFComponent } from './comp-detail/comp-detail-f/comp-detail-f.component'; 
import { RegistrationComponent } from './registration.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: DashboardComponent },
  { path: 'password-reset', component: PasswordResetComponent },
    { path: 'register', component:  RegistrationComponent },

    { path: 'detailA',
    component: CompDetailAComponent
  },
    { path: 'detailB',
    component: CompDetailBComponent
  },
      { path: 'calendrier',
    component: CalendrierComponent
  },
      { path: 'detailD',
    component: CompDetailDComponent
  },
    { path: 'detailE',
    component: CompDetailEComponent
  },
      { path: 'detailF',
    component: CompDetailFComponent
  },
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  
];
