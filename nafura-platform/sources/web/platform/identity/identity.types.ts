import { Signal } from '@angular/core';

import type { User } from '../../core/security/models/user.models';
import type { Tenant, TenantContext } from '../../core/security/models/tenant.models';
import type { AuthStatus } from '../../core/security/models/auth.models';

export type PlatformIdentityMode = 'keycloak' | 'sandbox-keycloak-mock';

export interface PlatformIdentityConfig {
  readonly mode?: PlatformIdentityMode;
}

export interface PlatformIdentitySnapshot {
  readonly status: Signal<AuthStatus>;
  readonly isAuthenticated: Signal<boolean>;
  readonly user: Signal<User | null>;
  readonly tenant: Signal<Tenant | null>;
  readonly tenantContext: Signal<TenantContext | null>;
}
