import { Injectable, Signal, inject } from '@angular/core';

import { AuthFacade } from '../../core/security/services/auth.facade';
import { TenantContextService } from '../../core/tenant/tenant.context';
import { PLATFORM_IDENTITY_CONFIG } from './identity.config';
import type { User } from '../../core/security/models/user.models';
import type { Tenant, TenantContext } from '../../core/tenant/tenant.types';
import type { AuthStatus } from '../../core/security/models/auth.models';
import type { PlatformIdentityMode } from './identity.types';

@Injectable({ providedIn: 'root' })
export class PlatformIdentityService {
  private readonly auth = inject(AuthFacade);
  private readonly tenantContextService = inject(TenantContextService);
  private readonly config = inject(PLATFORM_IDENTITY_CONFIG);

  readonly mode: PlatformIdentityMode = this.config.mode ?? 'keycloak';
  readonly status: Signal<AuthStatus> = this.auth.status;
  readonly isAuthenticated: Signal<boolean> = this.auth.isAuthenticated;
  readonly user: Signal<User | null> = this.auth.user;
  readonly tenant: Signal<Tenant | null> = this.tenantContextService.tenant;
  readonly tenantContext: Signal<TenantContext | null> = this.tenantContextService.context;

  async initialize(): Promise<void> {
    await this.auth.initialize();
  }

  async logout(redirectTo?: string): Promise<void> {
    await this.auth.logout(redirectTo);
  }
}
