import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  router.navigate(['/authentication/login']);
  return false;
};

// Prevent route matching entirely for unauthenticated users
export const authMatchGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  router.navigate(['/authentication/login']);
  return false;
};

// Guard all child routes as well
export const authChildGuard: CanActivateChildFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  router.navigate(['/authentication/login']);
  return false;
};
