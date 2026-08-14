/**
 * Token Service — decode and classify JWTs issued by the backend or Keycloak.
 * The browser never mints tokens.
 */

import { Injectable } from '@angular/core';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  isTokenExpired,
} from '../models/token.models';

const ONBOARDING_DEV_ISSUER = 'nafura-onboarding-dev';

@Injectable({ providedIn: 'root' })
export class TokenService {
  isExpired(exp: number): boolean {
    return isTokenExpired(exp);
  }

  getTimeUntilExpiry(token: string): number {
    const payload = this.decodeAccessToken(token);
    if (!payload) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  needsRefresh(token: string, thresholdSeconds: number = 300): boolean {
    return this.getTimeUntilExpiry(token) < thresholdSeconds;
  }

  /** Legacy in-browser mock JWTs (unsigned). Not accepted by the API. */
  isMockToken(accessToken: string): boolean {
    const payload = this.decodeAccessToken(accessToken);
    if (!payload) {
      return true;
    }
    if (payload.iss === ONBOARDING_DEV_ISSUER) {
      return false;
    }
    if (typeof payload.iss === 'string' && /^https?:\/\//.test(payload.iss)) {
      return false;
    }
    return true;
  }

  /** HS256 tokens issued by the ERP onboarding / Cursor QA backend. */
  isBackendOnboardingToken(accessToken: string): boolean {
    const payload = this.decodeAccessToken(accessToken);
    return payload?.iss === ONBOARDING_DEV_ISSUER;
  }

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

  getUserIdFromToken(token: string): string | null {
    const payload = this.decodeAccessToken(token);
    return payload?.sub ?? null;
  }

  getTenantIdFromToken(token: string): string | null {
    const payload = this.decodeAccessToken(token);
    return payload?.tid ?? null;
  }

  private base64UrlDecode(str: string): string {
    let padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = padded.length % 4;
    if (padding) {
      padded += '='.repeat(4 - padding);
    }
    return atob(padded);
  }
}
