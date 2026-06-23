/**
 * Auth Facade
 *
 * Main entry point for authentication operations.
 * Orchestrates state, API calls, and token management.
 */

import { Injectable, Signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env';
import { APPLICATION_REQUIRES_TENANT } from '../../../../applications/routes.generated';

import { AuthStateStore } from '../state/auth.state';
import { AuthApiService } from './auth-api.service';
import { TokenService } from './token.service';
import { TenantContextService } from '../../tenant/tenant.context';
import {
  LoginCredentials,
  RegisterData,
  AuthStatus,
  AuthError,
  StoredSession,
} from '../models/auth.models';
import { User, UserProfile } from '../models/user.models';
import { TenantMembership, TenantContext } from '../models/tenant.models';
import { TokenPair } from '../models/token.models';
import { SystemRoles } from '../models/user.models';

/**
 * Auth Facade
 *
 * Provides a clean API for authentication operations.
 * Manages the entire auth lifecycle.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly state = inject(AuthStateStore);
  private readonly api = inject(AuthApiService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly tenantContextService = inject(TenantContextService);

  // Token refresh timer
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Set up token refresh effect
    effect(() => {
      const tokens = this.state.tokens();
      if (tokens) {
        this.scheduleTokenRefresh(tokens.accessToken);
      } else {
        this.cancelTokenRefresh();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public Selectors (Expose State Signals)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Authentication status */
  readonly status: Signal<AuthStatus> = this.state.status;

  /** Current user */
  readonly user: Signal<User | null> = this.state.user;

  /** Is authenticated */
  readonly isAuthenticated: Signal<boolean> = this.state.isAuthenticated;

  /** Is loading */
  readonly isLoading: Signal<boolean> = this.state.isLoading;

  /** Current error */
  readonly error: Signal<AuthError | null> = this.state.error;

  /** User's tenant memberships */
  readonly tenants: Signal<TenantMembership[]> = this.state.tenants;

  /** Current tenant membership */
  readonly currentTenant: Signal<TenantMembership | null> = this.state.currentTenant;

  /** Current tenant context */
  readonly tenantContext: Signal<TenantContext | null> = this.state.tenantContext;

  /** Has multiple tenants */
  readonly hasMultipleTenants: Signal<boolean> = this.state.hasMultipleTenants;

  /** Is super admin */
  readonly isSuperAdmin: Signal<boolean> = this.state.isSuperAdmin;

  /** User's permissions */
  readonly permissions: Signal<Set<string>> = this.state.permissions;

  /** User's roles */
  readonly roles: Signal<string[]> = this.state.roles;

  /** Access token */
  readonly accessToken: Signal<string | null> = this.state.accessToken;

  /** User display name */
  readonly displayName: Signal<string> = computed(() => {
    const user = this.state.user();
    if (!user) return '';
    return (
      user.profile.displayName ||
      `${user.profile.firstName} ${user.profile.lastName}`.trim() ||
      user.email
    );
  });

  /** User initials */
  readonly userInitials: Signal<string> = computed(() => {
    const user = this.state.user();
    if (!user) return '';
    const first = user.profile.firstName?.[0] || '';
    const last = user.profile.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  });

  /**
   * True when lookup create shortcuts can be shown (authenticated, real token).
   */
  hasLookupCreateAccess(): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }
    const accessToken = this.accessToken();
    return !!accessToken && !this.tokenService.isMockToken(accessToken);
  }

  /** Session from signup/onboarding backend (no Keycloak refresh yet). */
  isOnboardingJwtSession(): boolean {
    const accessToken = this.accessToken();
    return !!accessToken && this.tokenService.isBackendOnboardingToken(accessToken);
  }

  /** Flush auth to storage so a new tab can restore the session on bootstrap. */
  persistSessionForNewTab(): void {
    if (this.isAuthenticated()) {
      this.state.persistSession(true);
    }
  }

  /** @deprecated Prefer {@link hasLookupCreateAccess} */
  canOpenErpCreateShortcuts(): boolean {
    return this.hasLookupCreateAccess() && !this.isOnboardingJwtSession();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Authentication Actions
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Initialize auth state from persisted session.
   * Call this on app startup.
   */
  async initialize(): Promise<void> {
    this.state.setStatus('checking');
    this.state.setLoading(true);

    // Dev-only: bypass Keycloak entirely or restore persisted mock session.
    if (environment.devAuthBypass) {
      try {
        if (this.isDevEagerBootstrap()) {
          await this.bypassLoginForDev();
        } else {
          const restored = await this.tryRestoreDevPersistedSession();
          if (!restored) {
            this.state.setStatus('unauthenticated');
          }
        }
      } finally {
        this.state.setLoading(false);
      }
      return;
    }

    try {
      const session = this.state.loadPersistedSession();

      if (!session) {
        this.state.setStatus('unauthenticated');
        this.state.setLoading(false);
        return;
      }

      const { accessToken, refreshToken } = session.tokens;

      // Onboarding dev JWTs have no Keycloak refresh token — restore if still valid.
      if (
        !refreshToken &&
        accessToken &&
        !this.tokenService.isMockToken(accessToken)
      ) {
        const payload = this.tokenService.decodeAccessToken(accessToken);
        if (payload && !this.tokenService.isExpired(payload.exp)) {
          await this.restorePersistedOnboardingSession(session);
          return;
        }
      }

      // Keycloak: skip refresh round-trip when access token is still valid (F5 / direct URL).
      if (accessToken && refreshToken && !this.tokenService.isMockToken(accessToken)) {
        const payload = this.tokenService.decodeAccessToken(accessToken);
        if (payload && !this.tokenService.isExpired(payload.exp)) {
          await this.restorePersistedKeycloakSession(session);
          return;
        }
      }

      if (!refreshToken) {
        this.state.clear();
        this.state.setStatus('unauthenticated');
        this.state.setLoading(false);
        return;
      }

      // Validate and refresh token
      const result = await this.api.refreshToken(
        refreshToken,
        session.tenantId ?? undefined
      );

      // Restore state from token
      this.state.setAuthenticatedFromToken(
        result.tokens,
        result.user
      );

      // Only tenant-enabled apps should resolve tenant memberships/context
      if (APPLICATION_REQUIRES_TENANT) {
        const tenants = await this.api.getUserTenants(
          result.user.id,
          result.tokens.accessToken
        );
        this.state.setTenants(tenants);

        const tenantId =
          session.tenantId ??
          this.state.loadPersistedTenant() ??
          this.state.currentTenant()?.tenant.id ??
          tenants[0]?.tenant.id ??
          null;

        if (tenantId) {
          if (tenants.some((t) => t.tenant.id === tenantId)) {
            this.state.selectTenant(tenantId);
          }
          await this.tenantContextService.initialize(tenantId);
          this.state.persistTenantSelection(tenantId);
        }
      } else {
        this.state.setTenants([]);
      }

      // Persist updated session
      this.state.persistSession(session.rememberMe);
    } catch (error) {
      this.state.clear();
      this.state.setStatus('unauthenticated');
    } finally {
      this.state.setLoading(false);
    }
  }

  /**
   * Initiate login by redirecting to Keycloak.
   * This replaces the credential-based login.
   */
  async login(): Promise<void> {
    if (environment.devAuthBypass) {
      if (this.isDevEagerBootstrap()) {
        await this.bypassLoginForDev();
        await this.router.navigateByUrl('/');
      } else {
        await this.router.navigateByUrl('/login');
      }
      return;
    }
    await this.api.login();
  }

  /**
   * Handle OAuth2 callback from Keycloak.
   * Called by AuthCallbackPage after Keycloak redirects back.
   */
  async handleCallback(code: string): Promise<boolean> {
    this.state.setLoading(true);
    this.state.setError(null);

    try {
      const response = await this.api.handleCallback(code);

      if (!response.user) {
        throw { code: 'unknown_error', message: 'No user data in callback response' } as AuthError;
      }

      // Set user and tokens from backend
      this.state.setAuthenticatedFromToken(
        response.tokens,
        response.user
      );

      // Only tenant-enabled apps should resolve tenant memberships/context
      if (APPLICATION_REQUIRES_TENANT) {
        const tenants = await this.api.getUserTenants(
          response.user.id,
          response.tokens.accessToken
        );
        this.state.setTenants(tenants);

        const tenantId =
          this.state.currentTenant()?.tenant.id ??
          tenants[0]?.tenant.id ??
          null;

        if (tenantId) {
          if (tenants.some((t) => t.tenant.id === tenantId)) {
            this.state.selectTenant(tenantId);
          }
          await this.tenantContextService.initialize(tenantId);
          this.state.persistTenantSelection(tenantId);
        }
      } else {
        this.state.setTenants([]);
      }

      // Persist session
      this.state.persistSession(true);

      return true;
    } catch (error) {
      this.state.setError(error as AuthError);
      return false;
    }
  }

  /**
   * Logout and clear session.
   * Redirects to Keycloak logout to invalidate SSO session.
   */
  async logout(redirectTo: string = '/login'): Promise<void> {
    const tokens = this.state.tokens();

    this.cancelTokenRefresh();
    this.state.clear();
    this.state.clearPersistedTenant();

    if (environment.devAuthBypass) {
      await this.router.navigateByUrl(redirectTo);
      return;
    }

    // Redirect to Keycloak logout (will redirect back to login page)
    await this.api.logout(tokens?.refreshToken);
  }

  /**
   * Register a new account.
   */
  async register(data: RegisterData): Promise<{
    success: boolean;
    message: string;
    resumed?: boolean;
    emailVerificationRequired?: boolean;
    loginRequired?: boolean;
  }> {
    this.state.setLoading(true);
    this.state.setError(null);

    try {
      const result = await this.api.register(data);
      if (environment.onboardingV2Enabled && result.accessToken) {
        this.applyBackendOnboardingTokens(result.user, result.accessToken, result.expiresIn ?? 900);
      }
      this.state.setLoading(false);
      return {
        success: true,
        message: result.message,
        resumed: result.resumed,
        emailVerificationRequired: result.emailVerificationRequired,
        loginRequired: result.loginRequired,
      };
    } catch (error) {
      this.state.setError(error as AuthError);
      this.state.setLoading(false);
      return { success: false, message: (error as AuthError).message };
    }
  }

  async completeEmailVerification(result: {
    userId: string | null;
    email: string;
    accessToken?: string;
    expiresIn?: number;
  }): Promise<void> {
    if (!result.userId) {
      throw new Error('User id missing after email verification');
    }
    const nowIso = new Date().toISOString();
    const user: User = {
      id: result.userId,
      email: result.email,
      profile: {
        firstName: '',
        lastName: '',
        displayName: result.email,
      },
      status: 'active',
      emailVerified: true,
      mfaEnabled: false,
      isSuperAdmin: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
    };
    if (result.accessToken) {
      this.applyBackendOnboardingTokens(user, result.accessToken, result.expiresIn ?? 900);
    }
  }

  /**
   * After onboarding tenant creation, attach tenant to dev session.
   */
  async attachOnboardingTenant(
    tenantId: string,
    tenantName: string,
    tenantKey: string,
    accessToken?: string,
    expiresIn?: number
  ): Promise<void> {
    const user = this.state.user();
    if (!user) {
      return;
    }
    const membership = this.buildOnboardingOwnerMembership(tenantId, tenantName, tenantKey);
    if (accessToken) {
      this.applyBackendOnboardingTokens(user, accessToken, expiresIn ?? 900, membership, tenantId);
      return;
    }

    // Keep the existing backend onboarding JWT (e.g. from signup) — never replace with a mock token.
    const existing = this.state.tokens()?.accessToken;
    if (existing && !this.tokenService.isMockToken(existing)) {
      this.state.setTenants([membership]);
      this.state.selectTenant(tenantId, membership);
      await this.tenantContextService.initialize(tenantId);
      this.state.persistSession(true);
      return;
    }

    if (environment.devAuthBypass) {
      const tokens = this.tokenService.generateTokenPair(user, membership, ['*'], false);
      this.state.setAuthenticatedFromToken(tokens, user);
      this.state.setTenants([membership]);
      this.state.selectTenant(tenantId, membership);
      await this.tenantContextService.initialize(tenantId);
      this.state.persistSession(true);
    }
  }

  private applyBackendOnboardingTokens(
    user: User,
    accessToken: string,
    expiresIn: number,
    membership?: TenantMembership,
    tenantId?: string
  ): void {
    const tokens: TokenPair = {
      accessToken,
      refreshToken: '',
      tokenType: 'Bearer',
      expiresIn,
      refreshExpiresIn: 0,
    };
    this.state.setAuthenticatedFromToken(tokens, user);
    if (membership && tenantId) {
      this.state.setTenants([membership]);
      this.state.selectTenant(tenantId, membership);
      void this.tenantContextService.initialize(tenantId);
    } else {
      this.state.setTenants([]);
      this.state.clearPersistedTenant();
    }
    this.state.persistSession(true);
  }

  private async restorePersistedOnboardingSession(session: StoredSession): Promise<void> {
    const payload = this.tokenService.decodeAccessToken(session.tokens.accessToken);
    if (!payload) {
      this.state.clear();
      this.state.setStatus('unauthenticated');
      return;
    }

    const user: User = {
      id: payload.sub,
      email: payload.email,
      profile: {
        firstName: payload.email.split('@')[0],
        lastName: '',
        displayName: payload.email,
      },
      status: 'active',
      emailVerified: true,
      mfaEnabled: false,
      isSuperAdmin: payload.sa ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.state.setAuthenticatedFromToken(session.tokens, user);

    const tenantId = session.tenantId ?? this.state.loadPersistedTenant();
    if (tenantId) {
      const membership = this.buildOnboardingOwnerMembership(tenantId, tenantId);
      this.state.setTenants([membership]);
      this.state.selectTenant(tenantId, membership);
      if (APPLICATION_REQUIRES_TENANT) {
        await this.tenantContextService.initialize(tenantId);
      }
    } else {
      this.state.setTenants([]);
    }

    this.state.persistSession(session.rememberMe);
    this.state.setLoading(false);
  }

  private async restorePersistedKeycloakSession(session: StoredSession): Promise<void> {
    try {
      const user = await this.api.getCurrentUser(session.tokens.accessToken);
      this.state.setAuthenticatedFromToken(session.tokens, user);

      if (APPLICATION_REQUIRES_TENANT) {
        const tenants = await this.api.getUserTenants(user.id, session.tokens.accessToken);
        this.state.setTenants(tenants);

        const tenantId =
          session.tenantId ??
          this.state.loadPersistedTenant() ??
          tenants[0]?.tenant.id ??
          null;

        if (tenantId) {
          if (tenants.some((t) => t.tenant.id === tenantId)) {
            this.state.selectTenant(tenantId);
          }
          await this.tenantContextService.initialize(tenantId);
          this.state.persistTenantSelection(tenantId);
        }
      } else {
        this.state.setTenants([]);
      }

      this.state.persistSession(session.rememberMe);
    } catch {
      this.state.clear();
      this.state.setStatus('unauthenticated');
    }
  }

  private buildOnboardingOwnerMembership(
    tenantId: string,
    tenantName: string,
    tenantKey?: string
  ): TenantMembership {
    const nowIso = new Date().toISOString();
    return {
      tenant: {
        id: tenantId,
        name: tenantName,
        slug: tenantKey ?? tenantId,
        status: 'active',
        enabledFeatures: [],
        enabledModules: [],
        features: {},
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      roles: [
        {
          id: 'OWNER',
          name: 'Owner',
          description: 'Onboarding owner',
          permissions: ['*'],
          isSystem: true,
          priority: 100,
        },
      ],
      permissions: ['*'],
      isDefault: true,
      status: 'active',
      joinedAt: nowIso,
    };
  }

  private async establishOnboardingDevSession(user: User): Promise<void> {
    // No tenant yet — omit tid from token so X-Tenant-Id is not sent with invalid UUID.
    const tokens = this.tokenService.generateTokenPair(user, undefined, ['*'], false);
    this.state.setAuthenticatedFromToken(tokens, user);
    this.state.setTenants([]);
    this.state.clearPersistedTenant();
    this.state.persistSession(true);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Tenant Actions
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Select a tenant.
   * For normal users: switches tenant and re-issues token.
   * For super admin: just initializes tenant context (no token re-issue needed).
   */
  async selectTenant(tenantId: string): Promise<boolean> {
    const user = this.state.user();
    const tokens = this.state.tokens();

    if (!user || !tokens) {
      return false;
    }

    this.state.setLoading(true);

    try {
      // For super admin: API will create temporary membership
      // For normal users: API validates membership exists
      const result = await this.api.switchTenant(
        user.id,
        tenantId,
        tokens.refreshToken
      );

      // Update tokens (includes new tenant ID in token)
      this.state.updateTokens(result.tokens);
      
      // Update state with new tenant
      if (result.membership) {
        // Use selectTenant which handles super admin case
        this.state.selectTenant(tenantId, result.membership);
      }
      
      this.state.persistSession();

      // Initialize tenant context after switch
      await this.tenantContextService.initialize(tenantId);

      return true;
    } catch (error) {
      this.state.setError(error as AuthError);
      return false;
    }
  }

  /**
   * Get available tenants for switching.
   */
  getAvailableTenants(): TenantMembership[] {
    return this.state.tenants();
  }

  /**
   * Update current user profile in state (e.g. after saving from User Settings).
   * Use this so the shell and other UI reflect the new display name / initials.
   */
  updateUserProfile(profile: Partial<UserProfile>): void {
    const user = this.state.user();
    if (!user) return;
    this.state.updateUser({
      profile: { ...user.profile, ...profile },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Token Management
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Manually refresh token.
   */
  async refreshToken(): Promise<boolean> {
    const tokens = this.state.tokens();
    const currentTenantId = this.state.currentTenantId();

    if (environment.devAuthBypass) {
      // In dev bypass mode: just regenerate a fresh fake token pair locally.
      await this.bypassLoginForDev();
      return true;
    }

    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      const result = await this.api.refreshToken(
        tokens.refreshToken,
        currentTenantId ?? undefined
      );

      this.state.updateTokens(result.tokens);
      this.state.persistSession();

      return true;
    } catch (error) {
      // Token refresh failed - logout
      await this.logout();
      return false;
    }
  }

  /**
   * Schedule automatic token refresh.
   */
  private scheduleTokenRefresh(accessToken: string): void {
    this.cancelTokenRefresh();

    const timeUntilExpiry = this.tokenService.getTimeUntilExpiry(accessToken);

    // Refresh 2 minutes before expiry
    const refreshIn = Math.max(0, (timeUntilExpiry - 120) * 1000);

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshIn);
  }

  /**
   * Cancel scheduled token refresh.
   */
  private cancelTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Password Management
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Request password reset email.
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    this.state.setLoading(true);

    try {
      const result = await this.api.requestPasswordReset({ email });
      this.state.setLoading(false);
      return { success: true, message: result.message };
    } catch (error) {
      this.state.setLoading(false);
      return { success: false, message: (error as AuthError).message };
    }
  }

  /**
   * Change password for current user.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const user = this.state.user();
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    this.state.setLoading(true);

    try {
      const result = await this.api.changePassword(user.id, {
        currentPassword,
        newPassword,
      });
      this.state.setLoading(false);
      return { success: true, message: result.message };
    } catch (error) {
      this.state.setLoading(false);
      return { success: false, message: (error as AuthError).message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Clear current error.
   */
  clearError(): void {
    this.state.setError(null);
  }

  /**
   * Check if user has a specific permission.
   */
  hasPermission(permission: string): boolean {
    if (this.state.isSuperAdmin()) {
      return true;
    }

    const permissions = this.state.permissions();
    return this.checkPermissionMatch(permission, permissions);
  }

  /**
   * Check if user has any of the specified permissions.
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Check if user has all of the specified permissions.
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Check if user has a specific role.
   */
  hasRole(role: string): boolean {
    return this.state.roles().includes(role);
  }

  /**
   * Check if user has any of the specified roles.
   */
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.state.roles();
    return roles.some(r => userRoles.includes(r));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Dev-only: Keycloak bypass
  // ─────────────────────────────────────────────────────────────────────────────

  private isDevEagerBootstrap(): boolean {
    return (environment as { devAuthEagerBootstrap?: boolean }).devAuthEagerBootstrap !== false;
  }

  /**
   * Dev-only : connexion in-app (mot de passe + code 2FA mock). Ne fait rien si `devAuthBypass` est désactivé.
   */
  async completeDevInAppAuth(
    password: string,
    totp: string,
  ): Promise<'ok' | 'bad_password' | 'bad_totp' | 'disabled'> {
    if (!environment.devAuthBypass) {
      return 'disabled';
    }
    const ref = (environment as { devInAppAuth?: { password: string; totp: string } }).devInAppAuth;
    const expectedPass = ref?.password ?? 'demo';
    const expectedTotp = ref?.totp ?? '123456';
    if (password !== expectedPass) {
      return 'bad_password';
    }
    if (totp !== expectedTotp) {
      return 'bad_totp';
    }
    await this.bypassLoginForDev();
    return 'ok';
  }

  private buildDemoDevUserAndMembership(): { user: User; membership: TenantMembership } {
    const cfg = environment.devAuthUser;
    const nowIso = new Date().toISOString();
    const fakeUser: User = {
      id: cfg.id || 'dev-user',
      email: cfg.email || 'dev@nafura.local',
      profile: {
        firstName: cfg.firstName || 'Dev',
        lastName: cfg.lastName || 'User',
        displayName: `${cfg.firstName || 'Dev'} ${cfg.lastName || 'User'}`.trim(),
      },
      status: 'active',
      emailVerified: true,
      mfaEnabled: false,
      isSuperAdmin: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
    };
    const fakeMembership: TenantMembership = {
      tenant: {
        id: cfg.tenantId || 'dev-tenant',
        name: cfg.tenantName || 'Dev Tenant',
        slug: cfg.tenantSlug || 'dev',
        status: 'active',
        enabledFeatures: ['stock', 'item', 'currency', 'inventory'],
        enabledModules: ['stock', 'item', 'currency', 'inventory'],
        features: {},
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      roles: [
        {
          id: SystemRoles.SUPER_ADMIN,
          name: 'Super Admin',
          description: 'Dev bypass role',
          permissions: ['*'],
          isSystem: true,
          priority: 100,
        },
      ],
      permissions: ['*'],
      isDefault: true,
      status: 'active',
      joinedAt: nowIso,
    };
    return { user: fakeUser, membership: fakeMembership };
  }

  private async tryRestoreDevPersistedSession(): Promise<boolean> {
    const session = this.state.loadPersistedSession();
    if (!session?.tokens?.accessToken) {
      return false;
    }
    const payload = this.tokenService.decodeAccessToken(session.tokens.accessToken);
    if (!payload?.sub) {
      this.state.clearPersistedSession();
      return false;
    }
    const { user, membership } = this.buildDemoDevUserAndMembership();
    if (payload.sub !== user.id) {
      this.state.clearPersistedSession();
      return false;
    }
    this.state.setAuthenticatedFromToken(session.tokens, user);
    this.state.setTenants([membership]);
    if (APPLICATION_REQUIRES_TENANT) {
      const tid = session.tenantId ?? membership.tenant.id;
      if (tid) {
        await this.tenantContextService.initialize(tid);
      }
    }
    this.state.persistSession(session.rememberMe);
    return true;
  }

  /**
   * Seed a fake super-admin session without going through Keycloak.
   * Only used when `environment.devAuthBypass === true`.
   */
  private async bypassLoginForDev(): Promise<void> {
    const { user, membership } = this.buildDemoDevUserAndMembership();
    const tokens = this.tokenService.generateTokenPair(
      user,
      membership,
      ['*'],
      true
    );

    this.state.setAuthenticatedFromToken(tokens, user);
    this.state.setTenants([membership]);

    if (APPLICATION_REQUIRES_TENANT) {
      await this.tenantContextService.initialize(membership.tenant.id);
    }

    this.state.persistSession(true);
  }

  /**
   * Check permission with wildcard support.
   */
  private checkPermissionMatch(
    permission: string,
    userPermissions: Set<string>
  ): boolean {
    // Direct match
    if (userPermissions.has(permission)) {
      return true;
    }

    // Check wildcards
    for (const userPerm of userPermissions) {
      if (userPerm.endsWith('*')) {
        const prefix = userPerm.slice(0, -1);
        if (permission.startsWith(prefix)) {
          return true;
        }
      }
      if (userPerm === '*') {
        return true;
      }
    }

    return false;
  }
}
