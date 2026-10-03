import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { HostAuthService } from './host-auth.service';

/** Where the identity provider sends the browser back with the authorization code. */
@Component({
  selector: 'nf-host-auth-callback',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="callback">
      @if (error()) {
        <p class="error">{{ error() }}</p>
        <a routerLink="/login">Réessayer</a>
      } @else {
        <p>Connexion…</p>
      }
    </div>
  `,
  styles: [`
    .callback { display: grid; place-items: center; align-content: center; gap: 12px; min-height: 100dvh; color: #475569; }
    .error { color: #b42318; }
  `],
})
export class HostAuthCallbackPage implements OnInit {
  private readonly auth = inject(HostAuthService);
  private readonly router = inject(Router);

  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const next = await this.auth.completeLogin(new URLSearchParams(location.search));
      await this.router.navigateByUrl(next, { replaceUrl: true });
    } catch {
      this.auth.clear();
      this.error.set('La connexion a échoué ou a expiré.');
    }
  }
}
