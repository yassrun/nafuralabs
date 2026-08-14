import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';
import { APP_ENV } from '../../core/env.token';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="wrap">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Venue Catalog</mat-card-title>
          <mat-card-subtitle>Console opérateur</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (busy()) {
            <mat-spinner diameter="36"></mat-spinner>
          } @else if (error()) {
            <p class="error">{{ error() }}</p>
          } @else {
            <p>Connectez-vous pour importer et revue les lieux.</p>
          }
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" type="button" [disabled]="busy()" (click)="login()">
            {{ env.useDevJwt ? 'Continuer (dev JWT)' : 'Connexion Keycloak' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .wrap {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(160deg, #f4f7fb, #e8eef6 55%, #dfe8f3);
    }
    mat-card { width: min(420px, 92vw); padding: 0.5rem; }
    .error { color: #b00020; }
    mat-spinner { margin: 1rem auto; }
  `,
})
export class LoginPage implements OnInit {
  readonly env = inject(APP_ENV);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    if (this.auth.isAuthenticated()) {
      await this.router.navigateByUrl('/catalog/search');
    }
  }

  async login(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.ensureSession();
      if (this.auth.isAuthenticated()) {
        await this.router.navigateByUrl('/catalog/search');
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Login failed');
      this.busy.set(false);
    }
  }
}
