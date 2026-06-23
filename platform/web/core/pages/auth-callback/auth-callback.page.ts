/**
 * Auth Callback Page
 * 
 * Handles OAuth2 callback from Keycloak.
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthFacade } from '../../security/services/auth.facade';
import { I18nService } from '../../i18n/i18n.service';
import { TenantContextService } from '../../tenant/tenant.context';
import { APPLICATION_DEFAULT_ROUTE, APPLICATION_REQUIRES_TENANT } from '../../../../applications/routes.generated';
import { LookupReferenceNavigationService } from '@lib/anatomy/services/lookup-reference-navigation.service';

@Component({
  selector: 'app-auth-callback-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-content">
        <div class="spinner"></div>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #f5f5f5;
    }
    .callback-content {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto 16px;
      border: 4px solid #e0e0e0;
      border-top-color: #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    p {
      color: #666;
      font-size: 14px;
    }
  `]
})
export class AuthCallbackPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthFacade);
  private readonly i18n = inject(I18nService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly lookupRefNav = inject(LookupReferenceNavigationService);

  message = 'Completing sign in...';

  private async navigateAfterAuth(): Promise<void> {
    const redirect = this.lookupRefNav.consumePostAuthRedirect();
    if (redirect) {
      await this.router.navigateByUrl(redirect);
      return;
    }
    await this.navigateToApplicationShell();
  }

  private async navigateToApplicationShell(): Promise<void> {
    const defaultRoute = APPLICATION_DEFAULT_ROUTE || 'feature-unavailable/unknown';
    const segments = defaultRoute.split('/').filter(Boolean);
    await this.router.navigate(['/', ...segments]);
  }

  async ngOnInit() {
    const code = this.route.snapshot.queryParams['code'];
    const error = this.route.snapshot.queryParams['error'];

    if (error) {
      this.message = 'Authentication failed. Redirecting to login...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    if (!code) {
      this.message = 'Invalid callback. Redirecting to login...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    try {
      // Handle the OAuth2 callback
      const success = await this.auth.handleCallback(code);

      if (success) {
        await this.i18n.loadRemoteLanguagePreference();

        if (!APPLICATION_REQUIRES_TENANT) {
          await this.navigateAfterAuth();
          return;
        }

        // Initialize tenant context if user has a tenant
        const currentTenant = this.auth.currentTenant();
        if (currentTenant) {
          await this.tenantContext.initialize(currentTenant.tenant.id);
          await this.navigateAfterAuth();
        } else if (this.auth.isSuperAdmin()) {
          await this.router.navigate(['/tenant-selection']);
        } else {
          await this.navigateAfterAuth();
        }
      } else {
        this.message = 'Authentication failed. Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      this.message = 'Authentication error. Redirecting to login...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }
}
