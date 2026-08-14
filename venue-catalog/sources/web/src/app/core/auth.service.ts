import { Injectable, inject, signal } from '@angular/core';
import { APP_ENV } from './env.token';

const TOKEN_KEY = 'venue_catalog_access_token';
const PKCE_VERIFIER_KEY = 'venue_catalog_pkce_verifier';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly env = inject(APP_ENV);
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());

  readonly accessToken = this.tokenSignal.asReadonly();

  isAuthenticated(): boolean {
    const token = this.tokenSignal();
    return !!token && !this.isExpired(token);
  }

  async ensureSession(): Promise<void> {
    if (this.isAuthenticated()) {
      return;
    }
    if (this.env.useDevJwt) {
      await this.loginWithDevJwt();
      return;
    }
    if (this.env.directKeycloakLogin) {
      await this.loginWithKeycloak();
    }
  }

  async loginWithDevJwt(): Promise<void> {
    const header = this.base64UrlJson({ alg: 'HS256', typ: 'JWT' });
    const now = Math.floor(Date.now() / 1000);
    const payload = this.base64UrlJson({
      sub: 'catalog-operator',
      preferred_username: 'catalog-operator',
      iat: now,
      exp: now + 8 * 3600,
      realm_access: { roles: ['CATALOG_OPERATOR', 'PLATFORM_ADMIN'] },
    });
    const data = `${header}.${payload}`;
    const signature = await this.hmacSha256Base64Url(data, this.env.devJwtSecret);
    this.persistToken(`${data}.${signature}`);
  }

  async loginWithKeycloak(): Promise<void> {
    const verifier = this.randomString(64);
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    const challenge = await this.sha256Base64Url(verifier);
    const redirectUri = `${this.env.publicWebOrigin}/auth/callback`;
    const params = new URLSearchParams({
      client_id: this.env.keycloakClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    window.location.assign(
      `${this.env.keycloakUrl}/realms/${this.env.keycloakRealm}/protocol/openid-connect/auth?${params}`
    );
  }

  async handleCallback(code: string): Promise<void> {
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    if (!verifier) {
      throw new Error('Missing PKCE verifier');
    }
    const redirectUri = `${this.env.publicWebOrigin}/auth/callback`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.env.keycloakClientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    const response = await fetch(
      `${this.env.keycloakUrl}/realms/${this.env.keycloakRealm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      }
    );
    if (!response.ok) {
      throw new Error(`Token exchange failed (${response.status})`);
    }
    const json = (await response.json()) as { access_token: string };
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    this.persistToken(json.access_token);
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
  }

  private persistToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  private readStoredToken(): string | null {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token || this.isExpired(token)) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  }

  private isExpired(token: string): boolean {
    try {
      const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(raw));
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now() + 30_000;
    } catch {
      return true;
    }
  }

  private base64UrlJson(value: unknown): string {
    return btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private base64UrlBytes(bytes: ArrayBuffer): string {
    const bin = Array.from(new Uint8Array(bytes), (b) => String.fromCharCode(b)).join('');
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }

  private async sha256Base64Url(value: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return this.base64UrlBytes(digest);
  }

  private async hmacSha256Base64Url(message: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return this.base64UrlBytes(signature);
  }
}
