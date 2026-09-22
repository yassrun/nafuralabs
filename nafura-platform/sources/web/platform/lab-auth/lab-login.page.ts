import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { LAB_AUTH_CONFIG } from './lab-auth.config';
import { LabAuthService } from './lab-auth.service';

@Component({
  selector: 'nf-lab-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login">
      <div class="card">
        <div class="logo">N</div>
        <h1>{{ productName }}</h1>
        <p>{{ subtitle }}</p>

        @if (loading()) {
          <p class="hint">Chargement des utilisateurs…</p>
        } @else if (users().length) {
          <label for="lab-user">Utilisateur</label>
          <select id="lab-user" [value]="selected()" (change)="onSelect($event)">
            @for (user of users(); track user.email) {
              <option [value]="user.email">{{ user.name }} — {{ user.role }}</option>
            }
          </select>
          <button type="button" [disabled]="!selected() || busy()" (click)="connect()">
            {{ busy() ? 'Connexion…' : 'Se connecter' }}
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
export class LabLoginPage implements OnInit {
  private readonly auth = inject(LabAuthService);
  private readonly router = inject(Router);
  private readonly config = inject(LAB_AUTH_CONFIG);

  readonly productName = this.config.productName;
  readonly subtitle = this.config.subtitle
    ?? 'Choisir un utilisateur lab. Session locale, sans Keycloak.';
  readonly users = this.auth.users;
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly selected = signal('');

  async ngOnInit(): Promise<void> {
    this.auth.clear();
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

  onSelect(event: Event): void {
    this.selected.set((event.target as HTMLSelectElement).value);
  }

  async connect(): Promise<void> {
    const email = this.selected();
    if (!email) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.login(email);
      await this.router.navigateByUrl(this.auth.homePath());
    } catch {
      this.error.set('Connexion impossible.');
    } finally {
      this.busy.set(false);
    }
  }
}
