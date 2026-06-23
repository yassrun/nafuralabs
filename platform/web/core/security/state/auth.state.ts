/**
 * Auth State
 *
 * Signal-based state management for authentication.
 * Provides reactive state and computed values.
 */

import { Injectable, Signal, computed, signal, inject } from '@angular/core';
import {
  AuthState,
  AuthStatus,
  AuthError,
  initialAuthState,
  StoredSession,
  SESSION_STORAGE_KEY,
  TENANT_STORAGE_KEY,
} from '../models/auth.models';
import { User } from '../models/user.models';
import { TokenPair, AccessTokenPayload } from '../models/token.models';
import { TenantMembership, TenantContext, Tenant } from '../models/tenant.models';
import { Role, Permission } from '../models/user.models';
import { TokenService } from '../services/token.service';
import { StorageAdapter, StorageFactory } from '../storage/index';

/**
 * Auth State Store
 *
 * Centralized state management using Angular signals.
 * Provides both state mutations and computed values.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateStore {
  private readonly tokenService = inject(TokenService);
  private readonly storageFactory = inject(StorageFactory);
  private readonly storage: StorageAdapter;

  constructor() {
    // Use sessionStorage by default (safer than localStorage)
    // Can be overridden via environment or high-security mode
    this.storage = this.storageFactory.createFromEnvironment();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Core State (Private Signals)
  // ─────────────────────────────────────────────────────────────────────────────

  private readonly _status = signal<AuthStatus>('idle');
  private readonly _user = signal<User | null>(null);
  private readonly _tenants = signal<TenantMembership[]>([]);
  private readonly _currentTenantId = signal<string | null>(null);
  private readonly _tokens = signal<TokenPair | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<AuthError | null>(null);
  private readonly _expiresAt = signal<number | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Public Selectors (Read-only Signals)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Current authentication status */
  readonly status: Signal<AuthStatus> = this._status.asReadonly();

  /** Current user */
  readonly user: Signal<User | null> = this._user.asReadonly();

  /** User's tenant memberships */
  readonly tenants: Signal<TenantMembership[]> = this._tenants.asReadonly();

  /** Currently selected tenant ID */
  readonly currentTenantId: Signal<string | null> = this._currentTenantId.asReadonly();

  /** Current tokens */
  readonly tokens: Signal<TokenPair | null> = this._tokens.asReadonly();

  /** Loading state */
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();

  /** Current error */
  readonly error: Signal<AuthError | null> = this._error.asReadonly();

  /** Session expiry timestamp */
  readonly expiresAt: Signal<number | null> = this._expiresAt.asReadonly();

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Selectors
  // ─────────────────────────────────────────────────────────────────────────────

  /** Is user authenticated */
  readonly isAuthenticated: Signal<boolean> = computed(
    () => this._status() === 'authenticated'
  );

  /** Is checking stored session */
  readonly isChecking: Signal<boolean> = computed(
    () => this._status() === 'checking'
  );

  /** Current tenant membership */
  readonly currentTenant: Signal<TenantMembership | null> = computed(() => {
    const tenantId = this._currentTenantId();
    const tenants = this._tenants();
    return tenants.find(t => t.tenant.id === tenantId) ?? null;
  });

  /** Current tenant context (for permission checks) */
  readonly tenantContext: Signal<TenantContext | null> = computed(() => {
    const membership = this.currentTenant();
    if (!membership) return null;

    return {
      tenant: membership.tenant,
      roles: membership.roles.map(r => r.id),
      permissions: new Set(membership.permissions),
      enabledFeatures: new Set(membership.tenant.enabledFeatures),
      enabledModules: new Set(membership.tenant.enabledModules),
      features: membership.tenant.features,
    };
  });

  /** User's permissions in current tenant (or all permissions for super admin) */
  readonly permissions: Signal<Set<string>> = computed(() => {
    const user = this._user();
    if (!user) return new Set<string>();

    // Super admin has all permissions
    if (user.isSuperAdmin) {
      return new Set<string>(['*']);
    }

    // Normal user: get permissions from tenant membership
    const membership = this.currentTenant();
    if (!membership) return new Set<string>();
    return new Set(membership.permissions);
  });

  /** User's roles in current tenant */
  readonly roles: Signal<string[]> = computed(() => {
    const membership = this.currentTenant();
    if (!membership) return [];
    return membership.roles.map(r => r.id);
  });

  /** Is super admin */
  readonly isSuperAdmin: Signal<boolean> = computed(
    () => this._user()?.isSuperAdmin ?? false
  );

  /** Has multiple tenants */
  readonly hasMultipleTenants: Signal<boolean> = computed(
    () => this._tenants().length > 1
  );

  /** Default tenant */
  readonly defaultTenant: Signal<TenantMembership | null> = computed(() => {
    const tenants = this._tenants();
    return tenants.find(t => t.isDefault) ?? tenants[0] ?? null;
  });

  /** Access token */
  readonly accessToken: Signal<string | null> = computed(
    () => this._tokens()?.accessToken ?? null
  );

  /** Has error */
  readonly hasError: Signal<boolean> = computed(() => this._error() !== null);

  /** Complete state snapshot */
  readonly snapshot: Signal<AuthState> = computed(() => ({
    status: this._status(),
    user: this._user(),
    tenants: this._tenants(),
    currentTenantId: this._currentTenantId(),
    currentTenant: this.currentTenant(),
    tokens: this._tokens(),
    isLoading: this._isLoading(),
    error: this._error(),
    expiresAt: this._expiresAt(),
  }));

  // ─────────────────────────────────────────────────────────────────────────────
  // State Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Set loading state.
   */
  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
    if (loading) {
      this._error.set(null);
    }
  }

  /**
   * Set error state.
   */
  setError(error: AuthError | null): void {
    this._error.set(error);
    this._isLoading.set(false);
  }

  /**
   * Set status.
   */
  setStatus(status: AuthStatus): void {
    this._status.set(status);
  }

  /**
   * Set authenticated state from token and user data from backend.
   * 
   * This method uses real data from the backend API:
   * - User info (from /api/auth/me)
   * - Tenant memberships will be loaded separately via setTenants()
   */
  setAuthenticatedFromToken(
    tokens: TokenPair,
    user?: User
  ): void {
    // Parse token to extract claims (for fallback)
    const payload = this.tokenService.decodeAccessToken(tokens.accessToken);
    
    if (!payload) {
      throw new Error('Invalid token: cannot decode payload');
    }

    // Use user from backend or reconstruct from token as fallback
    const userObj: User = user || {
      id: payload.sub,
      email: payload.email,
      profile: {
        firstName: payload.email.split('@')[0], // Fallback
        lastName: '',
        displayName: payload.email,
      },
      status: 'active',
      emailVerified: true,
      mfaEnabled: false,
      isSuperAdmin: payload.sa || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    // Store state - tenants will be set separately via setTenants()
    this._user.set(userObj);
    this._tokens.set(tokens);
    this._tenants.set([]); // Will be populated by setTenants()
    this._expiresAt.set(Date.now() + tokens.expiresIn * 1000);
    this._isLoading.set(false);
    this._error.set(null);
    this._status.set('authenticated');
  }

  /**
   * Set user's tenant memberships (from real backend API).
   */
  setTenants(tenants: TenantMembership[]): void {
    this._tenants.set(tenants);
    
    // Auto-select first/default tenant if none selected
    if (!this._currentTenantId() && tenants.length > 0) {
      const defaultTenant = tenants.find(t => t.isDefault) ?? tenants[0];
      if (defaultTenant) {
        this._currentTenantId.set(defaultTenant.tenant.id);
      }
    }
  }

  /**
   * Select a tenant.
   * For super admin: can select any tenant (even if not in tenants list).
   * For normal users: tenant must be in their tenants list.
   */
  selectTenant(tenantId: string, membership?: TenantMembership): boolean {
    const user = this._user();
    const tenants = this._tenants();
    const exists = tenants.some(t => t.tenant.id === tenantId);

    // Super admin can select any tenant (membership will be provided)
    if (user?.isSuperAdmin && membership) {
      // Add membership if not already in list
      if (!exists) {
        this._tenants.set([...tenants, membership]);
      }
      this._currentTenantId.set(tenantId);
      this._status.set('authenticated');
      this.persistTenantSelection(tenantId);
      return true;
    }

    // Normal user: tenant must exist in their list
    if (!exists) {
      return false;
    }

    this._currentTenantId.set(tenantId);
    this._status.set('authenticated');
    this.persistTenantSelection(tenantId);
    return true;
  }

  /**
   * Update tokens (after refresh).
   */
  updateTokens(tokens: TokenPair): void {
    this._tokens.set(tokens);
    this._expiresAt.set(Date.now() + tokens.expiresIn * 1000);
  }

  /**
   * Update user profile.
   */
  updateUser(user: Partial<User>): void {
    const currentUser = this._user();
    if (currentUser) {
      this._user.set({ ...currentUser, ...user });
    }
  }

  /**
   * Clear all auth state (logout).
   */
  clear(): void {
    this._status.set('unauthenticated');
    this._user.set(null);
    this._tenants.set([]);
    this._currentTenantId.set(null);
    this._tokens.set(null);
    this._isLoading.set(false);
    this._error.set(null);
    this._expiresAt.set(null);
    this.clearPersistedSession();
  }

  /**
   * Reset to initial state.
   */
  reset(): void {
    this._status.set('idle');
    this._user.set(null);
    this._tenants.set([]);
    this._currentTenantId.set(null);
    this._tokens.set(null);
    this._isLoading.set(false);
    this._error.set(null);
    this._expiresAt.set(null);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Session Persistence
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Persist session to storage.
   */
  persistSession(rememberMe: boolean = false): void {
    const tokens = this._tokens();
    const user = this._user();
    const tenantId = this._currentTenantId();
    const expiresAt = this._expiresAt();

    if (!tokens || !user || !expiresAt) return;

    const session: StoredSession = {
      tokens,
      userId: user.id,
      tenantId,
      expiresAt,
      rememberMe,
    };

    const serialized = JSON.stringify(session);
    // Always mirror to session adapter (tab-scoped).
    this.storage.setItem(SESSION_STORAGE_KEY, serialized);
    // Survive full reload / new tab when user opted in via Keycloak login (rememberMe=true).
    if (rememberMe) {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      } catch {
        /* quota / private mode */
      }
    }
  }

  /**
   * Load session from storage.
   */
  loadPersistedSession(): StoredSession | null {
    let sessionStr: string | null = null;
    try {
      sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      /* noop */
    }
    if (!sessionStr) {
      sessionStr = this.storage.getItem(SESSION_STORAGE_KEY);
    }
    if (!sessionStr) return null;

    try {
      const session: StoredSession = JSON.parse(sessionStr);

      // Check if expired
      if (Date.now() >= session.expiresAt) {
        this.clearPersistedSession();
        return null;
      }

      return session;
    } catch {
      this.clearPersistedSession();
      return null;
    }
  }

  /**
   * Persist tenant selection.
   */
  persistTenantSelection(tenantId: string): void {
    this.storage.setItem(TENANT_STORAGE_KEY, tenantId);
  }

  /**
   * Load persisted tenant selection.
   */
  loadPersistedTenant(): string | null {
    return this.storage.getItem(TENANT_STORAGE_KEY);
  }

  /**
   * Clear persisted session.
   */
  clearPersistedSession(): void {
    this.storage.removeItem(SESSION_STORAGE_KEY);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  /**
   * Clear persisted tenant.
   */
  clearPersistedTenant(): void {
    this.storage.removeItem(TENANT_STORAGE_KEY);
  }
}
