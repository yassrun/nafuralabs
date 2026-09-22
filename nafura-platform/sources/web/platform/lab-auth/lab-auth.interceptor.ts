import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { LAB_AUTH_CONFIG } from './lab-auth.config';
import { LabAuthService } from './lab-auth.service';

export const labAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(LAB_AUTH_CONFIG);
  if (
    req.url.includes('/api/public/')
    || req.url === config.usersUrl
    || req.url === config.sessionUrl
  ) {
    return next(req);
  }

  const token = inject(LabAuthService).accessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
