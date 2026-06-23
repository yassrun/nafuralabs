/**
 * Token Models
 *
 * JWT-like token types for the mock authentication system.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Token Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Token pair (access + refresh).
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
  refreshExpiresIn: number; // seconds
}

/**
 * Decoded access token payload.
 * 
 * Contains minimal stable claims to keep token size small.
 * Permissions are loaded from TenantContext (not in token) to allow
 * permission changes without re-issuing tokens (if version matches).
 */
export interface AccessTokenPayload {
  /** Subject (user ID) */
  sub: string;

  /** Email */
  email: string;

  /** Tenant ID (only for non-super-admin users) */
  tid?: string;

  /** Role IDs in current tenant (not full permission list) */
  roles: string[];

  /** Permission version - incremented when roles/permissions change */
  perm_v: number;

  /** Session version - incremented on password change, MFA changes, etc. */
  sess_v: number;

  /** Issued at (timestamp) */
  iat: number;

  /** Expires at (timestamp) */
  exp: number;

  /** Token ID (JWT ID) - used for revocation */
  jti: string;

  /** Issuer */
  iss: string;

  /** Is super admin */
  sa?: boolean;

  /**
   * @deprecated Permissions removed from token to reduce size.
   * Load permissions from TenantContext instead.
   * Kept for backward compatibility during migration.
   */
  perms?: string[];
}

/**
 * Decoded refresh token payload.
 */
export interface RefreshTokenPayload {
  /** Subject (user ID) */
  sub: string;

  /** Token ID */
  jti: string;

  /** Issued at (timestamp) */
  iat: number;

  /** Expires at (timestamp) */
  exp: number;

  /** Session ID */
  sid: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Token configuration.
 */
export interface TokenConfig {
  /** Access token lifetime in seconds */
  accessTokenLifetime: number;

  /** Refresh token lifetime in seconds */
  refreshTokenLifetime: number;

  /** Token issuer */
  issuer: string;

  /** Token audience */
  audience: string;
}

/**
 * Default token configuration.
 */
export const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  accessTokenLifetime: 15 * 60, // 15 minutes
  refreshTokenLifetime: 7 * 24 * 60 * 60, // 7 days
  issuer: 'project-fountain',
  audience: 'pf-frontend',
};

/**
 * Extended token lifetime (remember me).
 */
export const REMEMBER_ME_TOKEN_CONFIG: Partial<TokenConfig> = {
  refreshTokenLifetime: 30 * 24 * 60 * 60, // 30 days
};

// ─────────────────────────────────────────────────────────────────────────────
// Token Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a random token ID.
 */
export function generateTokenId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if timestamp is expired.
 */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt * 1000;
}

/**
 * Calculate expiry timestamp.
 */
export function calculateExpiry(lifetimeSeconds: number): number {
  return Math.floor(Date.now() / 1000) + lifetimeSeconds;
}
