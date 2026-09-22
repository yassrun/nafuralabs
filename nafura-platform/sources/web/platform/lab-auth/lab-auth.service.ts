import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthStateStore } from '../../core/security/state/auth.state';
import type { User } from '../../core/security/models/user.models';

import { LAB_AUTH_CONFIG } from './lab-auth.config';

export interface LabUserOption {
  email: string;
  name: string;
  role: string;
}

export interface LabSessionResponse extends LabUserOption {
  accessToken: string;
  tokenType: string;
}

const DEFAULT_STORAGE_KEY = 'nf.lab.session';

/**
 * Lab login without Keycloak. Lists users, stores the HS256 session, and publishes it
 * to the platform auth state so `nf-user-menu` can render the signed-in person.
 */
@Injectable({ providedIn: 'root' })
export class LabAuthService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateStore);
  private readonly config = inject(LAB_AUTH_CONFIG);
  private token: string | null = null;

  readonly users = signal<LabUserOption[]>([]);
  readonly current = signal<LabUserOption | null>(null);

  accessToken(): string | null {
    return this.token ?? readStored(this.storageKey())?.accessToken ?? null;
  }

  loginPath(): string {
    return this.config.loginPath ?? '/login';
  }

  homePath(): string {
    return this.config.homePath ?? '/';
  }

  /** Restore a stored lab session. A missing session stays on the login page. */
  async ensureSession(): Promise<void> {
    const stored = readStored(this.storageKey());
    if (!stored) {
      return;
    }
    this.apply(stored);
  }

  async refreshUsers(): Promise<void> {
    const rows = await firstValueFrom(this.http.get<LabUserOption[]>(this.config.usersUrl));
    this.users.set(rows);
  }

  async login(email: string): Promise<void> {
    const session = await firstValueFrom(
      this.http.post<LabSessionResponse>(this.config.sessionUrl, { email }),
    );
    this.apply(session);
  }

  clear(): void {
    this.token = null;
    this.current.set(null);
    sessionStorage.removeItem(this.storageKey());
    this.authState.clear();
  }

  private storageKey(): string {
    return this.config.storageKey ?? DEFAULT_STORAGE_KEY;
  }

  private apply(session: LabSessionResponse): void {
    this.token = session.accessToken;
    this.current.set({ email: session.email, name: session.name, role: session.role });
    sessionStorage.setItem(this.storageKey(), JSON.stringify(session));
    this.authState.setAuthenticatedFromToken(
      {
        accessToken: session.accessToken,
        refreshToken: session.accessToken,
        tokenType: 'Bearer',
        expiresIn: 12 * 60 * 60,
        refreshExpiresIn: 12 * 60 * 60,
      },
      toAuthUser(session),
    );
  }
}

function toAuthUser(session: LabUserOption): User {
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
    isSuperAdmin: session.role === 'SUPER_ADMIN',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
}

function readStored(storageKey: string): LabSessionResponse | null {
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LabSessionResponse;
  } catch {
    return null;
  }
}
