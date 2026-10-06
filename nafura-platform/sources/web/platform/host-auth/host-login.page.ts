import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { HOST_AUTH_OPTIONS } from './host-auth.config';
import { HostAuthService } from './host-auth.service';

/**
 * Sign-in screen of every host app: the lab user picker locally, the organization's identity provider elsewhere.
 * Reaching it with a session signs that session out (the user menu's "log out" lands here).
 */
@Component({
  selector: 'nf-host-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login">
      <div class="card">
        @if (productMark) {
          <img class="logo logo--image" [src]="productMark" alt="" />
        } @else {
          <div class="logo" aria-hidden="true">{{ productInitial }}</div>
        }
        <h1>{{ productName }}</h1>

        @if (mode() === 'lab') {
          <p>Choisir un utilisateur lab. Session locale, sans mot de passe.</p>
          @if (loading()) {
            <p class="hint">Chargement des utilisateurs…</p>
          } @else if (users().length) {
            <label for="lab-user">Utilisateur</label>
            <select id="lab-user" [value]="selected()" (change)="onSelect($event)">
              @for (user of users(); track user.email) {
                <option [value]="user.email">{{ user.name }} — {{ user.role }}</option>
              }
            </select>
            <button type="button" [disabled]="!selected() || busy()" (click)="connectAs()">
              {{ busy() ? 'Connexion…' : 'Se connecter' }}
            </button>
          }
        } @else if (mode() === 'oidc') {
          <p>Connectez-vous avec votre compte.</p>
          <button type="button" [disabled]="busy()" (click)="connectWithProvider()">
            {{ busy() ? 'Redirection…' : 'Se connecter' }}
          </button>
        }

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .login {
      display: grid;
      place-items: center;
      min-height: 100dvh;
      background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
      padding: 1.5rem;
    }
    .card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border-radius: 16px;
      padding: 2rem 1.75rem;
      box-shadow: 0 20px 50px rgb(0 0 0 / 18%);
    }
    .logo {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      margin-bottom: 12px;
      border-radius: 14px;
      background: #0d9488;
      color: #fff;
      font-size: 26px;
      font-weight: 800;
    }
    .logo--image { display: block; background: none; object-fit: contain; }
    h1 { margin: 0 0 8px; font-size: 1.35rem; }
    p { margin: 0 0 1.25rem; color: #64748b; font-size: 0.875rem; line-height: 1.45; }
    label { display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 600; color: #334155; }
    select, button {
      width: 100%;
      font: inherit;
      font-size: 0.875rem;
      border-radius: 8px;
    }
    select { padding: 10px 12px; border: 1px solid #cbd5e1; background: #fff; }
    button {
      margin-top: 12px;
      min-height: 40px;
      border: 0;
      background: #0f766e;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled { opacity: 0.6; cursor: default; }
    .hint, .error { margin-top: 12px; font-size: 0.8125rem; }
    .error { color: #b42318; }
  `],
})
export class HostLoginPage implements OnInit {
  private readonly auth = inject(HostAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly options = inject(HOST_AUTH_OPTIONS);

  readonly productName = this.options.productName;
  readonly productMark = this.options.productMark;
  readonly productInitial = this.options.productName.trim().charAt(0).toUpperCase();
  readonly mode = signal(this.auth.config()?.mode ?? null);
  readonly users = this.auth.users;
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly selected = signal('');

  async ngOnInit(): Promise<void> {
    if (this.auth.hasStoredSession()) {
      this.auth.signOut();
      if (this.mode() === 'oidc') return;
    }
    if (this.mode() === 'lab') {
      await this.loadLabUsers();
    } else if (!this.mode()) {
      this.error.set('Service de connexion indisponible.');
    }
  }

  onSelect(event: Event): void {
    this.selected.set((event.target as HTMLSelectElement).value);
  }

  async connectAs(): Promise<void> {
    const email = this.selected();
    if (!email) return;
    await this.attempt(async () => {
      await this.auth.loginAs(email);
      await this.router.navigateByUrl(this.returnUrl());
    });
  }

  async connectWithProvider(): Promise<void> {
    await this.attempt(() => this.auth.redirectToProvider(this.returnUrl()));
  }

  private returnUrl(): string {
    const raw = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
    return raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')
      ? raw
      : this.auth.homePath();
  }

  private async loadLabUsers(): Promise<void> {
    try {
      await this.auth.refreshUsers();
      const admin = this.users().find((user) => user.role === 'SUPER_ADMIN') ?? this.users()[0];
      this.selected.set(admin?.email ?? '');
    } catch {
      this.error.set('Impossible de charger les utilisateurs.');
    } finally {
      this.loading.set(false);
    }
  }

  private async attempt(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
    } catch {
      this.error.set('Connexion impossible.');
      this.busy.set(false);
    }
  }
}
