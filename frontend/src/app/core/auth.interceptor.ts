import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const user = auth.currentUser();
  if (user) {
    req = req.clone({ setHeaders: { 'X-User-Id': String(user.id) } });
  }
  return next(req);
};
