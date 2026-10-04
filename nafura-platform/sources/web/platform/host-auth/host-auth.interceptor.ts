import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { ApiConfigService } from '../../core/config/api-config.service';
import { HostAuthService } from './host-auth.service';

/** The bearer token goes only to the product's own API, never to public endpoints or other origins. */
export const hostAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isProductApi(req.url, inject(ApiConfigService).getApiBaseUrl())) {
    return next(req);
  }
  const token = inject(HostAuthService).accessToken();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

/** `/api/...` on the page's origin or on the configured API origin (absolute in lab and on clusters), public endpoints excluded. */
export function isProductApi(url: string, apiBaseUrl: string): boolean {
  const here = globalThis.location?.origin ?? 'http://localhost';
  let target: URL;
  try {
    target = new URL(url, here);
  } catch {
    return false;
  }
  const apiOrigin = new URL(apiBaseUrl || '/', here).origin;
  if (target.origin !== here && target.origin !== apiOrigin) return false;
  return target.pathname.startsWith('/api/') && !target.pathname.startsWith('/api/public/');
}
