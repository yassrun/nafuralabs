import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthFacade } from '../../../core/security/services/auth.facade';

const POST_AUTH_REDIRECT_KEY = 'nafura_post_auth_redirect';

@Injectable({ providedIn: 'root' })
export class LookupReferenceNavigationService {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  canOpen(route?: string): boolean {
    return !!route?.trim() && this.auth.hasLookupCreateAccess();
  }

  /** Opens a referential listing in a new tab (session flushed to storage first). */
  openListingInNewTab(route: string): void {
    const trimmed = route.trim();
    if (!trimmed || !this.auth.hasLookupCreateAccess()) {
      return;
    }

    this.auth.persistSessionForNewTab();

    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const target = trimmed.startsWith('http') ? trimmed : `${window.location.origin}${path}`;
    window.open(target, '_blank');
  }

  rememberPostAuthRedirect(route: string): void {
    const trimmed = route.trim();
    if (!trimmed.startsWith('/')) {
      return;
    }
    sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, trimmed);
  }

  consumePostAuthRedirect(): string | null {
    const route = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    if (!route?.startsWith('/')) {
      return null;
    }
    return route;
  }

  navigateAfterAuth(): void {
    const redirect = this.consumePostAuthRedirect();
    if (redirect) {
      void this.router.navigateByUrl(redirect);
      return;
    }
    const defaultRoute = this.router.routerState.snapshot.url || '/';
    if (defaultRoute !== '/login' && defaultRoute !== '/auth/callback') {
      void this.router.navigateByUrl(defaultRoute);
    }
  }
}
