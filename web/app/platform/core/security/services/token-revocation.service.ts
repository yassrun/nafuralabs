/**
 * Token Revocation Service
 *
 * Manages revoked token IDs (JTI) to prevent use of invalidated tokens.
 * With Keycloak, token revocation is handled server-side.
 * This service provides a local cache for performance.
 */

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenRevocationService {
  private readonly revokedTokens = new Set<string>();

  /**
   * Check if a token JTI is revoked (local check only).
   */
  isRevoked(jti: string): boolean {
    return this.revokedTokens.has(jti);
  }

  /**
   * Revoke a specific token by JTI (local only).
   * With Keycloak, logout invalidates tokens server-side.
   */
  async revokeToken(jti: string): Promise<void> {
    this.revokedTokens.add(jti);
  }

  /**
   * Revoke all tokens for a user (local only).
   * With Keycloak, this is handled via Keycloak logout.
   */
  async revokeUserTokens(userId: string): Promise<void> {
    // Token revocation is handled by Keycloak logout
    // Local cache is cleared on logout
  }

  /**
   * Load revocation list (no-op with Keycloak).
   */
  async loadRevocationList(): Promise<void> {
    // With Keycloak, token validation happens server-side
    // No need to load revocation list client-side
  }

  /**
   * Clear local revocation list.
   */
  clear(): void {
    this.revokedTokens.clear();
  }
}
