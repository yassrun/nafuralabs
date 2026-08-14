/**
 * Tenant Header Interceptor
 *
 * Automatically adds X-Tenant-Id header to all HTTP requests.
 * Skips auth endpoints which don't require tenant context.
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from '../tenant/tenant.context';
import { AuthStateStore } from '../security/state/auth.state';

// Shape-only: RFC version/variant nibbles vary (e.g. Nafura tenant …-684f-… is v6).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isExternalAuthRequest = (url: string): boolean =>
  url.includes('keycloak') ||
  url.includes('iam.nafura.local') ||
  url.includes('iam.nafuralabs.staging') ||
  url.includes('iam.nafuralabs.com') ||
  url.includes('/protocol/openid-connect/');

export const tenantHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  // Never attach tenant header to Keycloak / OIDC token endpoints (CORS preflight rejection).
  if (isExternalAuthRequest(req.url)) {
    return next(req);
  }

  // Skip tenant header for auth / onboarding endpoints (no tenant required yet)
  if (
    req.url.includes('/api/auth/') ||
    req.url.includes('/api/public/') ||
    req.url.includes('/api/onboarding/')
  ) {
    return next(req);
  }

  // Tenant creation before a real tenant exists
  if (req.method === 'POST' && /\/api\/tenants\/?$/.test(req.url.replace(/\?.*$/, ''))) {
    return next(req);
  }

  const tenantContext = inject(TenantContextService);
  const authState = inject(AuthStateStore);

  let tenantId = tenantContext.tenantId();
  if (!tenantId) {
    tenantId = authState.currentTenantId();
  }
  if (!tenantId) {
    tenantId = authState.loadPersistedSession()?.tenantId ?? null;
  }

  if (tenantId && UUID_RE.test(tenantId)) {
    const clonedReq = req.clone({
      setHeaders: {
        'X-Tenant-Id': tenantId,
      },
    });
    return next(clonedReq);
  }

  // No tenant context - proceed without header (will fail on backend)
  return next(req);
};
