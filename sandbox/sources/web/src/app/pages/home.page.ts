import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SANDBOX_NAV } from '../nav/sandbox-nav.config';

@Component({
  selector: 'sb-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <header class="home__hero">
        <h1>Sandbox</h1>
        <p>
          Lab d’administration plateforme — paramètres user / organisation, impression,
          numérotation. Connecté en session lab (pas Keycloak).
        </p>
      </header>

      @for (section of sections; track section.id) {
        <section class="home__section">
          <h2>{{ section.label }}</h2>
          <div class="home__grid">
            @for (item of section.items; track item.id) {
              <a class="card" [routerLink]="item.route">
                <div class="card__top">
                  <strong>{{ item.label }}</strong>
                  <span class="badge" [class.badge--live]="item.status === 'live'">{{
                    item.status
                  }}</span>
                </div>
                @if (item.description) {
                  <p>{{ item.description }}</p>
                }
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .home {
        padding: 24px;
        max-width: 1100px;
      }
      .home__hero h1 {
        margin: 0 0 8px;
        font-size: 1.75rem;
      }
      .home__hero p {
        margin: 0 0 28px;
        color: var(--nf-text-muted, #64748b);
        line-height: 1.5;
      }
      .home__section h2 {
        margin: 0 0 12px;
        font-size: 0.75rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--nf-text-muted, #64748b);
      }
      .home__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
        margin-bottom: 28px;
      }
      .card {
        display: block;
        padding: 14px;
        border: 1px solid var(--nf-border-default, #e2e8f0);
        border-radius: 10px;
        background: #fff;
        color: inherit;
        text-decoration: none;
      }
      .card:hover {
        border-color: #94a3b8;
      }
      .card__top {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      .card p {
        margin: 0;
        font-size: 0.8125rem;
        color: #64748b;
      }
      .badge {
        font-size: 0.65rem;
        text-transform: uppercase;
        padding: 1px 6px;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        color: #64748b;
      }
      .badge--live {
        border-color: #86efac;
        color: #166534;
        background: #f0fdf4;
      }
    `,
  ],
})
export class HomePage {
  readonly sections = SANDBOX_NAV;
}
