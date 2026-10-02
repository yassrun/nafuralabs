import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthStateStore } from '../../core/security/state/auth.state';
import type { User } from '../../core/security/models/user.models';
import type { TenantMembership } from '../../core/security/models/tenant.models';
import { TenantContextService } from '../../core/tenant/tenant.context';

import { LAB_AUTH_CONFIG } from './lab-auth.config';

export interface LabUserOption {
  email: string;
  name: string;
  role: string;
}

export interface LabTenant {
  id: string;
  key: string;
  name: string;
}

export interface LabSessionResponse extends LabUserOption {
  accessToken: string;
  tokenType: string;
  tenant?: LabTenant;
}

const DEFAULT_STORAGE_KEY = 'nf.lab.session';

/**
 * Lab login without Keycloak. Lists users, stores the HS256 session, and publishes it
 * to the platform auth state so `nf-user-menu` can render the signed-in person.
 */
@Injectable({ providedIn: 'root' })
export class LabAuthService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateStore);
  private readonly tenantContext = inject(TenantContextService);
  private readonly config = inject(LAB_AUTH_CONFIG);
  private token: string | null = null;
  private restoring: Promise<void> | null = null;

  readonly users = signal<LabUserOption[]>([]);
  readonly current = signal<LabUserOption | null>(null);
  /** Effective permissions enforced by the backend for this session; `null` until loaded. */
  readonly permissions = signal<ReadonlySet<string> | null>(null);
  /** Domains the organization switched off: the backend refuses them whatever the role. */
  readonly disabledDomains = signal<ReadonlySet<string>>(new Set());
  readonly access = computed(() => ({ permissions: this.permissions(), disabledDomains: this.disabledDomains() }));

  accessToken(): string | null {
    return this.token ?? readStored(this.storageKey())?.accessToken ?? null;
  }

  loginPath(): string {
    return this.config.loginPath ?? '/login';
  }

  homePath(): string {
    return this.config.homePath ?? '/';
  }

  /** Restore a stored lab session. A missing or pre-tenant session stays on the login page. */
  async ensureSession(): Promise<void> {
    this.restoring ??= this.restore();
    await this.restoring;
  }

  private async restore(): Promise<void> {
    const stored = readStored(this.storageKey());
    if (!stored?.tenant) {
      sessionStorage.removeItem(this.storageKey());
      return;
    }
    await this.apply(stored);
  }

  async refreshUsers(): Promise<void> {
    const rows = await firstValueFrom(this.http.get<LabUserOption[]>(this.config.usersUrl));
    this.users.set(rows);
  }

  async login(email: string): Promise<void> {
    const session = await firstValueFrom(
      this.http.post<LabSessionResponse>(this.config.sessionUrl, { email }),
    );
    this.restoring = this.apply(session);
    await this.restoring;
  }

  clear(): void {
    this.token = null;
    this.current.set(null);
    this.permissions.set(null);
    this.disabledDomains.set(new Set());
    this.restoring = null;
    sessionStorage.removeItem(this.storageKey());
    this.authState.clear();
    this.tenantContext.clear();
  }

  private storageKey(): string {
    return this.config.storageKey ?? DEFAULT_STORAGE_KEY;
  }

  private async apply(session: LabSessionResponse): Promise<void> {
    this.token = session.accessToken;
    this.current.set({ email: session.email, name: session.name, role: session.role });
    sessionStorage.setItem(this.storageKey(), JSON.stringify(session));
    this.authState.setAuthenticatedFromToken(
      {
        accessToken: session.accessToken,
        refreshToken: session.accessToken,
        tokenType: 'Bearer',
        expiresIn: 12 * 60 * 60,
        refreshExpiresIn: 12 * 60 * 60,
      },
      toAuthUser(session),
    );
    await this.loadPermissions(session);
  }

  private async loadPermissions(session: LabSessionResponse): Promise<void> {
    this.permissions.set(null);
    try {
      const permissions = await this.fetchAccess();
      await this.enterTenant(session, permissions);
    } catch {
      // Unknown permissions: guarded navigation stays hidden, the backend still decides.
      this.permissions.set(new Set());
    }
  }

  /** Reload what the session may do, e.g. after an administrator switched a domain on or off. */
  async refreshAccess(): Promise<void> {
    if (this.current()) await this.fetchAccess();
  }

  private async fetchAccess(): Promise<string[]> {
    const url = this.config.permissionsUrl ?? '/api/v1/me/permissions';
    const response = await firstValueFrom(
      this.http.get<{ permissions: string[]; disabledDomains?: string[] }>(url),
    );
    this.permissions.set(new Set(response.permissions));
    this.disabledDomains.set(new Set(response.disabledDomains ?? []));
    return response.permissions;
  }

  /** Tenant-scoped screens (members, roles, domains) need the lab tenant as current context. */
  private async enterTenant(session: LabSessionResponse, permissions: string[]): Promise<void> {
    if (!session.tenant) return;
    const now = new Date().toISOString();
    const membership: TenantMembership = {
      tenant: {
        id: session.tenant.id,
        name: session.tenant.name,
        slug: session.tenant.key,
        status: 'active',
        enabledFeatures: [],
        enabledModules: [],
        features: {},
        createdAt: now,
        updatedAt: now,
      },
      roles: [{ id: session.role, name: session.role, description: '', permissions, isSystem: true, priority: 0 }],
      permissions,
      isDefault: true,
      status: 'active',
      joinedAt: now,
    };
    this.authState.setTenants([membership]);
    await this.tenantContext.initialize(session.tenant.id);
  }
}

function toAuthUser(session: LabUserOption): User {
  const [firstName, ...rest] = session.name.split(' ');
  const now = new Date().toISOString();
  return {
    id: session.email,
    email: session.email,
    profile: {
      firstName: firstName || session.name,
      lastName: rest.join(' '),
      displayName: session.name,
    },
    status: 'active',
    emailVerified: true,
    mfaEnabled: false,
    isSuperAdmin: session.role === 'SUPER_ADMIN',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
}

function readStored(storageKey: string): LabSessionResponse | null {
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LabSessionResponse;
  } catch {
    return null;
  }
}
