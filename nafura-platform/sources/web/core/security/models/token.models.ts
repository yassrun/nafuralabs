/**
 * JWT payload types for tokens issued by Keycloak or the onboarding backend.
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

  /** Backend onboarding / Cursor JWT claim (alias of sa). */
  super_admin?: boolean;

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

/**
 * Check if timestamp is expired.
 */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt * 1000;
}
