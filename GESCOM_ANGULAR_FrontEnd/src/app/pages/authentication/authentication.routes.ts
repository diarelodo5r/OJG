import { Routes } from '@angular/router';

import { AppLoginComponent } from './login/login.component';
import { AppRegisterComponent } from './register/register.component';
import { AppSideLoginComponent } from './side-login/side-login.component';
import { AppSideRegisterComponent } from './side-register/side-register.component';
import { AppErrorComponent } from './error/error.component';
import { AppMaintenanceComponent } from './maintenance/maintenance.component';

export const AuthenticationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        component: AppLoginComponent,
      },
      {
        path: 'register',
        component: AppRegisterComponent,
      },
      {
        path: 'side-login',
        component: AppSideLoginComponent,
      },
      {
        path: 'side-register',
        component: AppSideRegisterComponent,
      },
      {
        path: 'error',
        component: AppErrorComponent,
      },
      {
        path: 'maintenance',
        component: AppMaintenanceComponent,
      },
    ],
  },
];
