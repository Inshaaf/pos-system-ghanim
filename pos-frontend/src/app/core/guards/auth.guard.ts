import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isOwner()) return true;
  router.navigate([auth.defaultRoute()]);
  return false;
};

export const storePersonGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isOwner() || auth.isStorePerson()) return true;
  router.navigate([auth.defaultRoute()]);
  return false;
};

export const needsGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isOwner() || auth.isSalesperson()) return true;
  router.navigate([auth.defaultRoute()]);
  return false;
};
