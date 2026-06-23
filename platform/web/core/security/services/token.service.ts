/**
 * Token Service
 *
 * JWT-like mock token handling.
 * Creates, validates, and decodes mock tokens.
 */

import { Injectable } from '@angular/core';
import {
  TokenPair,
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenConfig,
  DEFAULT_TOKEN_CONFIG,
  REMEMBER_ME_TOKEN_CONFIG,
  generateTokenId,
  calculateExpiry,
  isTokenExpired,
} from '../models/token.models';
import { User } from '../models/user.models';
import { TenantMembership } from '../models/tenant.models';

/**
 * Token Service
 *
 * Handles JWT-like token operations for the mock auth system.
 * In a real app, tokens would be created by the backend.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private config: TokenConfig = DEFAULT_TOKEN_CONFIG;

  // ─────────────────────────────────────────────────────────────────────────────
  // Token Generation
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate a token pair for a user.
   * 
   * @param user - User object
   * @param membership - Current tenant membership (if user has a tenant)
   * @param permissions - Permissions calculated from roles (backend responsibility)
   * @param rememberMe - Extended session
   */
  generateTokenPair(
    user: User,
    membership?: TenantMembership,
    permissions?: string[], // Deprecated: kept for backward compatibility, not included in token
    rememberMe: boolean = false,
    permVersion: number = 1, // Permission version (incremented when roles/permissions change)
    sessVersion: number = 1  // Session version (incremented on password change, etc.)
  ): TokenPair {
    const config = rememberMe
      ? { ...this.config, ...REMEMBER_ME_TOKEN_CONFIG }
      : this.config;

    const now = Math.floor(Date.now() / 1000);
    const sessionId = generateTokenId();

    // Create access token payload with minimal stable claims
    // Permissions are NOT included - loaded from TenantContext instead
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      tid: membership?.tenant.id, // Only for non-super-admin users
      roles: membership?.roles.map(r => r.id) || [], // Role IDs only, not permissions
      perm_v: permVersion, // Permission version for staleness detection
      sess_v: sessVersion, // Session version for security events
      iat: now,
      exp: calculateExpiry(config.accessTokenLifetime),
      jti: generateTokenId(),
      iss: config.issuer,
      sa: user.isSuperAdmin || undefined,
      // perms removed to reduce token size - load from TenantContext instead
    };

    // Create refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: generateTokenId(),
      iat: now,
      exp: calculateExpiry(config.refreshTokenLifetime),
      sid: sessionId,
    };

    return {
      accessToken: this.encodeToken(accessPayload),
      refreshToken: this.encodeToken(refreshPayload),
      tokenType: 'Bearer',
      expiresIn: config.accessTokenLifetime,
      refreshExpiresIn: config.refreshTokenLifetime,
    };
  }

  /**
   * Generate new access token from refresh token.
   */
  refreshAccessToken(
    refreshToken: string,
    user: User,
    membership?: TenantMembership,
    permissions?: string[]
  ): TokenPair | null {
    const refreshPayload = this.decodeRefreshToken(refreshToken);

    if (!refreshPayload || this.isExpired(refreshPayload.exp)) {
      return null;
    }

    // Verify user ID matches
    if (refreshPayload.sub !== user.id) {
      return null;
    }

    // Generate new token pair with same session
    return this.generateTokenPair(user, membership, permissions);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Token Validation
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Validate an access token.
   */
  validateAccessToken(token: string): AccessTokenPayload | null {
    const payload = this.decodeAccessToken(token);

    if (!payload) {
      return null;
    }

    // Check expiration
    if (this.isExpired(payload.exp)) {
      return null;
    }

    // Check issuer
    if (payload.iss !== this.config.issuer) {
      return null;
    }

    return payload;
  }

  /**
   * Validate a refresh token.
   */
  validateRefreshToken(token: string): RefreshTokenPayload | null {
    const payload = this.decodeRefreshToken(token);

    if (!payload) {
      return null;
    }

    if (this.isExpired(payload.exp)) {
      return null;
    }

    return payload;
  }

  /**
   * Check if token is expired.
   */
  isExpired(exp: number): boolean {
    return isTokenExpired(exp);
  }

  /**
   * Get time until token expires (in seconds).
   */
  getTimeUntilExpiry(token: string): number {
    const payload = this.decodeAccessToken(token);
    if (!payload) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  /**
   * Check if token needs refresh (less than 5 minutes remaining).
   */
  needsRefresh(token: string, thresholdSeconds: number = 300): boolean {
    return this.getTimeUntilExpiry(token) < thresholdSeconds;
  }

  /** True for locally generated dev/mock JWTs (not accepted by the backend API). */
  isMockToken(accessToken: string): boolean {
    const payload = this.decodeAccessToken(accessToken);
    if (!payload) {
      return true;
    }
    return payload.iss === DEFAULT_TOKEN_CONFIG.issuer;
  }

  /** True for HS256 tokens issued by the ERP onboarding backend. */
  isBackendOnboardingToken(accessToken: string): boolean {
    const payload = this.decodeAccessToken(accessToken);
    return payload?.iss === 'nafura-onboarding-dev';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Token Encoding/Decoding (Mock JWT)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Encode a payload to a mock JWT token.
   * In production, this would be done server-side with proper signing.
   */
  private encodeToken(payload: object): string {
    // Mock JWT structure: header.payload.signature
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));

    // Mock signature (not cryptographically secure)
    const signature = this.base64UrlEncode(
      `mock-signature-${Date.now()}`
    );

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  /**
   * Decode an access token.
   */
  decodeAccessToken(token: string): AccessTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      return payload as AccessTokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Decode a refresh token.
   */
  decodeRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      return payload as RefreshTokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get user ID from token without full validation.
   */
  getUserIdFromToken(token: string): string | null {
    const payload = this.decodeAccessToken(token);
    return payload?.sub ?? null;
  }

  /**
   * Get tenant ID from token.
   */
  getTenantIdFromToken(token: string): string | null {
    const payload = this.decodeAccessToken(token);
    return payload?.tid ?? null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Base64 URL encode.
   */
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Base64 URL decode.
   */
  private base64UrlDecode(str: string): string {
    // Add padding
    let padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = padded.length % 4;
    if (padding) {
      padded += '='.repeat(4 - padding);
    }
    return atob(padded);
  }

  /**
   * Update token configuration.
   */
  setConfig(config: Partial<TokenConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
