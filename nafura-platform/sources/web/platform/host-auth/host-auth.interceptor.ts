import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { HostAuthService } from './host-auth.service';

/** The bearer token goes only to the product's own API, never to public endpoints or other origins. */
export const hostAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/') || req.url.startsWith('/api/public/')) {
    return next(req);
  }
  const token = inject(HostAuthService).accessToken();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
