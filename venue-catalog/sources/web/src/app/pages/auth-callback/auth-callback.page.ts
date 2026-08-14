import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth-callback-page',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="wrap">
      @if (error()) {
        <p class="error">{{ error() }}</p>
      } @else {
        <mat-spinner diameter="40"></mat-spinner>
        <p>Finalisation de la connexion…</p>
      }
    </div>
  `,
  styles: `
    .wrap {
      min-height: 100vh;
      display: grid;
      place-items: center;
      gap: 1rem;
    }
    .error { color: #b00020; }
  `,
})
export class AuthCallbackPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.error.set('Missing authorization code');
      return;
    }
    try {
      await this.auth.handleCallback(code);
      await this.router.navigateByUrl('/catalog/search');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Callback failed');
    }
  }
}
