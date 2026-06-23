/**
 * Auth API Service
 *
 * Real authentication service using Keycloak OAuth2 Authorization Code flow.
 * Replaces AuthApiMock for production use.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env';
import {
  LoginResponse,
  RegisterData,
  PasswordResetRequest,
  ChangePasswordRequest,
  AuthError,
  AuthErrorCode,
} from '../models/auth.models';
import { User } from '../models/user.models';
import { TenantMembership } from '../models/tenant.models';
import { TokenPair } from '../models/token.models';
import { ApiConfigService } from '../../config/api-config.service';
import { APPLICATION_REQUIRES_TENANT } from '../../../../applications/routes.generated';

/**
 * Auth API Service
 *
 * Implements OAuth2 Authorization Code flow with Keycloak.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly SESSION_KEY = 'nafura_session_active';
  private readonly ID_TOKEN_KEY = 'nafura_id_token';
  private readonly CODE_VERIFIER_KEY = 'nafura_code_verifier';

  private readonly keycloakUrl = environment.keycloakUrl;
  private readonly realm = environment.keycloakRealm;
  private readonly apiConfig = inject(ApiConfigService);
  
  private get apiBaseUrl(): string {
    return this.apiConfig.getApiBaseUrl();
  }

  private get clientId(): string {
    if (typeof window === 'undefined') {
      return environment.keycloakClientId;
    }

    const hostname = window.location.hostname.toLowerCase();
    const localMatch = hostname.match(/^([a-z0-9-]+)\.nafura\.local$/i);
    if (localMatch) {
      const appId = localMatch[1].toLowerCase();
      if (!['app', 'api', 'iam', 'minio', 's3'].includes(appId)) {
        return `${appId}-web`;
      }
    }

    const prodMatch = hostname.match(/^([a-z0-9-]+)\.nafura\.com$/i);
    if (prodMatch) {
      const appId = prodMatch[1].toLowerCase();
      if (!['app', 'api', 'iam', 'minio', 's3'].includes(appId)) {
        return `${appId}-web`;
      }
    }

    return environment.keycloakClientId;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OAuth2 Authorization Code Flow with PKCE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Initiate login by redirecting to Keycloak with PKCE.
   */
  async login(): Promise<void> {
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = this.generateCodeVerifier();
    const { challenge, method } = await this.generateCodeChallenge(codeVerifier);
    
    // Store code verifier for token exchange
    sessionStorage.setItem(this.CODE_VERIFIER_KEY, codeVerifier);
    
    const authUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth` +
      `?client_id=${this.clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=openid profile email` +
      `&code_challenge=${challenge}` +
      `&code_challenge_method=${method}`;
    
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth2 callback with authorization code.
   * Exchange code for tokens using PKCE code verifier.
   */
  async handleCallback(code: string): Promise<LoginResponse> {
    const redirectUri = window.location.origin + '/auth/callback';
    
    // Retrieve and clear the code verifier
    const codeVerifier = sessionStorage.getItem(this.CODE_VERIFIER_KEY);
    sessionStorage.removeItem(this.CODE_VERIFIER_KEY);
    
    if (!codeVerifier) {
      throw this.createError('invalid_credentials', 'Missing PKCE code verifier. Please try logging in again.');
    }
    
    // Exchange code for tokens at Keycloak token endpoint
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', this.clientId);
    body.set('code', code);
    body.set('redirect_uri', redirectUri);
    body.set('code_verifier', codeVerifier);

    try {
      const tokenResponse = await firstValueFrom(
        this.http.post<KeycloakTokenResponse>(tokenUrl, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );

      // Parse tokens
      const tokens: TokenPair = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        tokenType: 'Bearer',
        refreshExpiresIn: tokenResponse.refresh_expires_in || tokenResponse.expires_in * 2,
      };

      // Get user info from backend (which has the tenant/permission info)
      const user = await this.getCurrentUser(tokens.accessToken);

      // Mark session as active and store id_token for logout
      localStorage.setItem(this.SESSION_KEY, 'true');
      if (tokenResponse.id_token) {
        localStorage.setItem(this.ID_TOKEN_KEY, tokenResponse.id_token);
      }

      return { tokens, user };
    } catch (error: any) {
      throw this.createError('invalid_credentials', error.message || 'Authentication failed');
    }
  }

  /**
   * Logout from Keycloak.
   * Uses id_token_hint to skip the confirmation page.
   */
  async logout(refreshToken?: string): Promise<void> {
    const idToken = localStorage.getItem(this.ID_TOKEN_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.ID_TOKEN_KEY);

    // Redirect to Keycloak logout with id_token_hint to skip confirmation
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
    let logoutUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout` +
      `?client_id=${this.clientId}` +
      `&post_logout_redirect_uri=${redirectUri}`;
    
    // Add id_token_hint to skip the logout confirmation page
    if (idToken) {
      logoutUrl += `&id_token_hint=${idToken}`;
    }
    
    window.location.href = logoutUrl;
  }

  /**
   * Refresh access token using refresh token.
   */
  async refreshToken(
    refreshToken: string,
    tenantId?: string
  ): Promise<{ tokens: TokenPair; user: User }> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.clientId);
    body.set('refresh_token', refreshToken);

    try {
      const tokenResponse = await firstValueFrom(
        this.http.post<KeycloakTokenResponse>(tokenUrl, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );

      const tokens: TokenPair = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        tokenType: 'Bearer',
        refreshExpiresIn: tokenResponse.refresh_expires_in || tokenResponse.expires_in * 2,
      };

      // Get user info from backend
      const user = await this.getCurrentUser(tokens.accessToken);

      return { tokens, user };
    } catch (error: any) {
      throw this.createError('token_invalid', 'Token refresh failed');
    }
  }

  /**
   * Get current user info from backend.
   */
  async getCurrentUser(accessToken: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.get<UserResponse>(`${this.apiBaseUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      );

      return this.mapUserResponse(response);
    } catch (error: any) {
      throw this.createError('invalid_credentials', 'Failed to get user info');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Tenant APIs (call backend)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get user's tenant memberships from backend.
   */
  async getUserTenants(userId: string, accessToken: string): Promise<TenantMembership[]> {
    if (!APPLICATION_REQUIRES_TENANT) {
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.http.get<TenantMembershipResponse[]>(`${this.apiBaseUrl}/api/auth/tenants`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      );

      return response.map(this.mapTenantMembership);
    } catch (error) {
      return [];
    }
  }

  /**
   * Switch tenant.
   */
  async switchTenant(
    userId: string,
    tenantId: string,
    currentRefreshToken: string
  ): Promise<{ tokens: TokenPair; membership: TenantMembership | undefined }> {
    // For now, just refresh the token (backend handles tenant context)
    const result = await this.refreshToken(currentRefreshToken, tenantId);
    
    // Get tenant membership
    const tenants = await this.getUserTenants(userId, result.tokens.accessToken);
    const membership = tenants.find(t => t.tenant.id === tenantId);

    return { tokens: result.tokens, membership };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Legacy methods (for compatibility)
  // These would be handled by Keycloak in production
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Self-service signup (onboarding v2) or Keycloak in production.
   */
  async register(data: RegisterData): Promise<{
    user: User;
    message: string;
    accessToken?: string;
    expiresIn?: number;
    resumed?: boolean;
    emailVerificationRequired?: boolean;
    loginRequired?: boolean;
  }> {
    if (!environment.onboardingV2Enabled) {
      throw this.createError('unknown_error', 'Registration is handled by administrator');
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const locale = (data.preferredLocale as 'fr' | 'en' | 'ar') || 'fr';
    let result: {
      userId: string;
      email: string;
      message: string;
      accessToken?: string;
      expiresIn?: number;
      resumed?: boolean;
      emailVerificationRequired?: boolean;
      loginRequired?: boolean;
    };
    try {
      result = await firstValueFrom(
        this.http.post<{
          userId: string;
          email: string;
          message: string;
          accessToken?: string;
          expiresIn?: number;
          resumed?: boolean;
          emailVerificationRequired?: boolean;
          loginRequired?: boolean;
        }>(
          `${base}/api/public/onboarding/signup`,
          {
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            preferredLocale: locale,
          }
        )
      );
    } catch (err: unknown) {
      const body = (err as { error?: { message?: string } })?.error?.message ?? '';
      if (String(body).includes('EMAIL_ALREADY')) {
        throw this.createError('unknown_error', 'EMAIL_ALREADY_REGISTERED');
      }
      throw this.createError('unknown_error', 'Registration failed');
    }
    const nowIso = new Date().toISOString();
    const user: User = {
      id: result.userId,
      email: result.email,
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: `${data.firstName} ${data.lastName}`.trim(),
      },
      status: 'active',
      emailVerified: !result.emailVerificationRequired,
      mfaEnabled: false,
      isSuperAdmin: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
    };
    return {
      user,
      message: result.message,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      resumed: result.resumed,
      emailVerificationRequired: result.emailVerificationRequired,
      loginRequired: result.loginRequired,
    };
  }

  async verifyOnboardingEmail(token: string): Promise<{
    user: User;
    message: string;
    accessToken: string;
    expiresIn: number;
  }> {
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const result = await firstValueFrom(
      this.http.post<{
        userId: string;
        email: string;
        message: string;
        accessToken: string;
        expiresIn: number;
      }>(`${base}/api/public/onboarding/verify-email`, { token })
    );
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
    return {
      user,
      message: result.message,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * Password reset is handled by Keycloak.
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    // Redirect to Keycloak's forgot password page
    const forgotPasswordUrl = `${this.keycloakUrl}/realms/${this.realm}/login-actions/reset-credentials`;
    window.location.href = forgotPasswordUrl;
    return { message: 'Redirecting to password reset...' };
  }

  /**
   * Change password is handled by Keycloak account console.
   */
  async changePassword(
    userId: string,
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    // Redirect to Keycloak account console
    const accountUrl = `${this.keycloakUrl}/realms/${this.realm}/account`;
    window.open(accountUrl, '_blank');
    return { message: 'Opening Keycloak account console...' };
  }

  /**
   * Check if session is active.
   */
  isSessionActive(): boolean {
    return localStorage.getItem(this.SESSION_KEY) === 'true';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────────

  private createError(code: AuthErrorCode, message: string): AuthError {
    return { code, message };
  }

  private mapUserResponse(response: UserResponse): User {
    return {
      id: response.id,
      email: response.email,
      profile: {
        firstName: response.firstName || '',
        lastName: response.lastName || '',
        displayName: response.displayName || `${response.firstName} ${response.lastName}`.trim(),
        avatarUrl: response.avatarUrl,
      },
      status: 'active',
      emailVerified: true,
      mfaEnabled: false,
      isSuperAdmin: response.isSuperAdmin || false,
      createdAt: response.createdAt || new Date().toISOString(),
      updatedAt: response.updatedAt || new Date().toISOString(),
      lastLoginAt: response.lastLoginAt ?? null,
    };
  }

  private mapTenantMembership(response: TenantMembershipResponse): TenantMembership {
    // Compute permissions from roles (aggregate all permissions from all roles)
    const permissions = new Set<string>();
    if (response.roles) {
      for (const role of response.roles) {
        if (role.permissions) {
          for (const perm of role.permissions) {
            permissions.add(perm);
          }
        }
      }
    }
    
    const enabledModules = response.enabledModules || response.enabledDomains || [];

    return {
      tenant: {
        id: response.tenantId,
        name: response.tenantName,
        slug: response.tenantKey,
        status: 'active',
        enabledFeatures: enabledModules,
        enabledModules: enabledModules,
        features: {},
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString(),
      },
      roles: response.roles || [],
      permissions: Array.from(permissions), // Computed from roles[].permissions
      isDefault: response.isDefault || false,
      status: 'active',
      joinedAt: response.joinedAt || new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PKCE Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate a cryptographically random code verifier for PKCE.
   * Must be between 43-128 characters, using unreserved URI characters.
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  /**
   * Generate code challenge from code verifier.
   * Uses SHA-256 (S256) when crypto.subtle is available (HTTPS),
   * falls back to plain method for HTTP development environments.
   */
  private async generateCodeChallenge(codeVerifier: string): Promise<{ challenge: string; method: string }> {
    // crypto.subtle is only available in secure contexts (HTTPS or localhost)
    if (crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return {
          challenge: this.base64UrlEncode(new Uint8Array(digest)),
          method: 'S256'
        };
      } catch (e) {
        // Fall through to plain method
      }
    }
    
    // Fallback: plain method (less secure, but works on HTTP)
    // Note: This should only be used in development environments
    console.warn('PKCE: Using plain method (crypto.subtle not available). Use HTTPS in production!');
    return {
      challenge: codeVerifier,
      method: 'plain'
    };
  }

  /**
   * Base64 URL encode (no padding, URL-safe characters).
   */
  private base64UrlEncode(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────────────────

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
  scope?: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  isSuperAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface RoleResponse {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  priority: number;
}

interface TenantMembershipResponse {
  tenantId: string;
  tenantKey: string;
  tenantName: string;
  enabledModules?: string[];
  enabledDomains?: string[];
  roles?: RoleResponse[];
  // permissions removed - computed from roles[].permissions on frontend
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  joinedAt?: string;
}
