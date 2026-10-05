import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthStateStore } from '../../core/security/state/auth.state';
import type { User } from '../../core/security/models/user.models';
import type { TenantMembership } from '../../core/security/models/tenant.models';
import { TenantContextService } from '../../core/tenant/tenant.context';

import { HOST_AUTH_OPTIONS } from './host-auth.config';
import { type OidcClient, type OidcTokens, authorizeUrl, codeChallenge, exchangeCode, logoutUrl, randomToken, refreshTokens } from './oidc';

/** Decided by the backend's environment: the lab picker locally, the shared OIDC provider on clusters. */
export type AuthRuntimeConfig =
  | { readonly mode: 'lab'; readonly usersUrl: string; readonly sessionUrl: string }
  | { readonly mode: 'oidc'; readonly issuer: string; readonly clientId: string };

export interface LabUserOption {
  email: string;
  name: string;
  role: string;
}

/** GET /api/v1/me/session: who is signed in, and in which organization. */
export interface HostSession {
  email: string;
  name: string;
  roles: string[];
  superAdmin: boolean;
  tenant: { id: string; key: string; name: string } | null;
}

/** GET /api/v1/me/organizations: every membership, audience included. */
export interface HostOrganization {
  id: string;
  key: string;
  name: string;
  slug: string;
  status: string;
  audience: string;
  roles: string[];
}

interface PendingLogin {
  state: string;
  verifier: string;
  returnUrl: string;
}

const CONFIG_URL = '/api/public/auth/config';
const SESSION_URL = '/api/v1/me/session';
const ORGANIZATIONS_URL = '/api/v1/me/organizations';
const PERMISSIONS_URL = '/api/v1/me/permissions';
const CALLBACK_PATH = '/auth/callback';
/** Refresh this long before the access token expires. */
const REFRESH_MARGIN_MS = 60_000;

/**
 * Signs a host app in, whatever the environment provides (lab picker or OIDC Authorization Code + PKCE),
 * then publishes the session to the platform state (user menu, tenant context, navigation access).
 */
@Injectable({ providedIn: 'root' })
export class HostAuthService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateStore);
  private readonly tenantContext = inject(TenantContextService);
  private readonly options = inject(HOST_AUTH_OPTIONS);
  private tokens: OidcTokens | null = null;
  private restoring: Promise<void> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  readonly config = signal<AuthRuntimeConfig | null>(null);
  readonly users = signal<LabUserOption[]>([]);
  readonly current = signal<HostSession | null>(null);
  /** Effective permissions enforced by the backend for this session; `null` until loaded. */
  readonly permissions = signal<ReadonlySet<string> | null>(null);
  /** Domains the organization switched off: the backend refuses them whatever the role. */
  readonly disabledDomains = signal<ReadonlySet<string>>(new Set());
  readonly access = computed(() => ({ permissions: this.permissions(), disabledDomains: this.disabledDomains() }));

  /** Unreachable backend: no mode, the login page says the service is unavailable instead of a blank app. */
  async loadConfig(): Promise<void> {
    try {
      this.config.set(await firstValueFrom(this.http.get<AuthRuntimeConfig>(CONFIG_URL)));
    } catch {
      this.config.set(null);
    }
  }

  accessToken(): string | null {
    return this.tokens?.accessToken ?? null;
  }

  loginPath(): string {
    return '/login';
  }

  homePath(): string {
    return this.options.homePath ?? '/';
  }

  /** Restore the tab's session. Nothing stored (or no longer valid) stays on the login page. */
  async ensureSession(): Promise<void> {
    this.restoring ??= this.restore();
    await this.restoring;
  }

  /** A session exists in this tab (possibly expired): the login page then signs it out first. */
  hasStoredSession(): boolean {
    return sessionStorage.getItem(this.storageKey()) !== null;
  }

  // Lab

  async refreshUsers(): Promise<void> {
    const config = this.labConfig();
    this.users.set(await firstValueFrom(this.http.get<LabUserOption[]>(config.usersUrl)));
  }

  async loginAs(email: string): Promise<void> {
    const config = this.labConfig();
    const session = await firstValueFrom(this.http.post<{ accessToken: string }>(config.sessionUrl, { email }));
    // Lab tokens last the whole lab session (12 h) and have no refresh token.
    await this.start({ accessToken: session.accessToken, expiresAt: Date.now() + 12 * 3600_000 });
  }

  // OIDC

  /** Leaves the app for the provider's login page; it comes back to /auth/callback. */
  async redirectToProvider(returnUrl = this.homePath()): Promise<void> {
    const client = this.oidcClient();
    const pending: PendingLogin = { state: randomToken(16), verifier: randomToken(48), returnUrl };
    sessionStorage.setItem(this.pendingKey(), JSON.stringify(pending));
    location.assign(authorizeUrl(client, this.callbackUrl(), pending.state, await codeChallenge(pending.verifier)));
  }

  /** Completes the provider's redirect; returns where to go next. */
  async completeLogin(query: URLSearchParams): Promise<string> {
    const pending = readJson<PendingLogin>(this.pendingKey());
    sessionStorage.removeItem(this.pendingKey());
    const code = query.get('code');
    if (!pending || !code || query.get('state') !== pending.state) {
      throw new Error(query.get('error_description') ?? 'Invalid sign-in response');
    }
    await this.start(await exchangeCode(this.oidcClient(), code, pending.verifier, this.callbackUrl()));
    return safeReturnUrl(pending.returnUrl, this.homePath());
  }

  /** Ends the session here and, with OIDC, at the provider (single sign-out). */
  signOut(): void {
    const idToken = this.tokens?.idToken ?? readJson<OidcTokens>(this.storageKey())?.idToken;
    this.clear();
    const config = this.config();
    if (config?.mode === 'oidc') {
      location.assign(logoutUrl(this.oidcClient(), `${location.origin}${this.loginPath()}`, idToken));
    }
  }

  clear(): void {
    this.tokens = null;
    this.current.set(null);
    this.permissions.set(null);
    this.disabledDomains.set(new Set());
    this.restoring = null;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
    sessionStorage.removeItem(this.storageKey());
    this.authState.clear();
    this.tenantContext.clear();
  }

  /** Reload what the session may do, e.g. after an administrator switched a domain on or off. */
  async refreshAccess(): Promise<void> {
    if (this.current()) await this.fetchAccess();
  }

  private async restore(): Promise<void> {
    let stored = readJson<OidcTokens>(this.storageKey());
    if (!stored) return;
    if (stored.expiresAt - REFRESH_MARGIN_MS <= Date.now()) {
      stored = await this.renewed(stored);
      if (!stored) return;
    }
    try {
      await this.start(stored);
    } catch {
      this.clear();
    }
  }

  private async start(tokens: OidcTokens): Promise<void> {
    this.store(tokens);
    const session = await firstValueFrom(this.http.get<HostSession>(SESSION_URL));
    this.current.set(session);
    this.authState.setAuthenticatedFromToken(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: Math.max(0, Math.round((tokens.expiresAt - Date.now()) / 1000)),
        refreshExpiresIn: 0,
      },
      toAuthUser(session),
    );
    await this.loadAccess(session);
  }

  private store(tokens: OidcTokens): void {
    this.tokens = tokens;
    sessionStorage.setItem(this.storageKey(), JSON.stringify(tokens));
    this.scheduleRefresh(tokens);
  }

  private scheduleRefresh(tokens: OidcTokens): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
    if (!tokens.refreshToken) return;
    const delay = Math.max(5_000, tokens.expiresAt - Date.now() - REFRESH_MARGIN_MS);
    this.refreshTimer = setTimeout(async () => {
      const renewed = await this.renewed(tokens);
      if (renewed) this.store(renewed);
      else location.assign(this.loginPath());
    }, delay);
  }

  /** Null when the provider session is over: sign in again. */
  private async renewed(tokens: OidcTokens): Promise<OidcTokens | null> {
    if (!tokens.refreshToken || this.config()?.mode !== 'oidc') {
      sessionStorage.removeItem(this.storageKey());
      return null;
    }
    try {
      const fresh = await refreshTokens(this.oidcClient(), tokens.refreshToken);
      return { ...fresh, idToken: fresh.idToken ?? tokens.idToken };
    } catch {
      sessionStorage.removeItem(this.storageKey());
      return null;
    }
  }

  private async loadAccess(session: HostSession): Promise<void> {
    this.permissions.set(null);
    try {
      const organizations = await this.fetchOrganizations();
      const chosen = this.chooseOrganization(organizations, session);
      if (chosen) {
        this.current.set({ ...session, tenant: { id: chosen.id, key: chosen.key, name: chosen.name } });
        this.publishOrganizations(organizations, chosen);
        await this.tenantContext.initialize(chosen.id);
      }
      const permissions = await this.fetchAccess();
      await this.enterTenant(this.current() ?? session, permissions, organizations, chosen);
    } catch {
      // Unknown permissions: guarded navigation stays hidden, the backend still decides.
      this.permissions.set(new Set());
    }
  }

  private async fetchOrganizations(): Promise<HostOrganization[]> {
    try {
      return await firstValueFrom(this.http.get<HostOrganization[]>(ORGANIZATIONS_URL));
    } catch {
      return [];
    }
  }

  /** Last organization used, otherwise the session's, otherwise the only one, otherwise the first. */
  private chooseOrganization(organizations: HostOrganization[], session: HostSession): HostOrganization | null {
    if (!organizations.length) return null;
    const stored = this.authState.loadPersistedTenant();
    return organizations.find((organization) => organization.id === stored)
      ?? organizations.find((organization) => organization.id === session.tenant?.id)
      ?? organizations[0];
  }

  private publishOrganizations(organizations: HostOrganization[], chosen: HostOrganization): void {
    const now = new Date().toISOString();
    const memberships: TenantMembership[] = organizations.map((organization) => ({
      tenant: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug || organization.key,
        status: organization.status === 'SUSPENDED' ? 'suspended' : 'active',
        enabledFeatures: [],
        enabledModules: [],
        features: {},
        createdAt: now,
        updatedAt: now,
      },
      roles: organization.roles.map((role) => ({ id: role, name: role, description: '', permissions: [], isSystem: true, priority: 0 })),
      permissions: [],
      isDefault: organization.id === chosen.id,
      status: 'active',
      joinedAt: now,
      audience: organization.audience,
    }));
    this.authState.setTenants(memberships);
    this.authState.selectTenant(chosen.id);
  }

  private async fetchAccess(): Promise<string[]> {
    const response = await firstValueFrom(
      this.http.get<{ permissions: string[]; disabledDomains?: string[] }>(PERMISSIONS_URL),
    );
    this.permissions.set(new Set(response.permissions));
    this.disabledDomains.set(new Set(response.disabledDomains ?? []));
    return response.permissions;
  }

  /** Tenant-scoped screens need the organization as current context. Several memberships stay in the one selector. */
  private async enterTenant(
    session: HostSession,
    permissions: string[],
    organizations: HostOrganization[] = [],
    chosen: HostOrganization | null = null,
  ): Promise<void> {
    if (organizations.length && chosen) {
      const now = new Date().toISOString();
      const memberships: TenantMembership[] = organizations.map((organization) => ({
        tenant: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug || organization.key,
          status: organization.status === 'SUSPENDED' ? 'suspended' : 'active',
          enabledFeatures: [],
          enabledModules: [],
          features: {},
          createdAt: now,
          updatedAt: now,
        },
        roles: organization.roles.map((role) => ({ id: role, name: role, description: '', permissions, isSystem: true, priority: 0 })),
        permissions,
        isDefault: organization.id === chosen.id,
        status: 'active',
        joinedAt: now,
        audience: organization.audience,
      }));
      this.authState.setTenants(memberships);
      this.authState.selectTenant(chosen.id);
      await this.tenantContext.initialize(chosen.id);
      return;
    }
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
      roles: session.roles.map((role) => ({ id: role, name: role, description: '', permissions, isSystem: true, priority: 0 })),
      permissions,
      isDefault: true,
      status: 'active',
      joinedAt: now,
    };
    this.authState.setTenants([membership]);
    await this.tenantContext.initialize(session.tenant.id);
  }

  private labConfig() {
    const config = this.config();
    if (config?.mode !== 'lab') throw new Error('Lab sign-in is not available here');
    return config;
  }

  private oidcClient(): OidcClient {
    const config = this.config();
    if (config?.mode !== 'oidc') throw new Error('OIDC sign-in is not available here');
    return config;
  }

  private callbackUrl(): string {
    return `${location.origin}${CALLBACK_PATH}`;
  }

  private storageKey(): string {
    return `${this.options.storageKey}.session`;
  }

  private pendingKey(): string {
    return `${this.options.storageKey}.pending-login`;
  }
}

/** Only in-app paths: never an open redirect to another origin. */
function safeReturnUrl(url: string, fallback: string): string {
  return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\') ? url : fallback;
}

function toAuthUser(session: HostSession): User {
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
    isSuperAdmin: session.superAdmin,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
}

function readJson<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
