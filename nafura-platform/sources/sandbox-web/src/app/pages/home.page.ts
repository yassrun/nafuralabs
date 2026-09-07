import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SHOWROOM_NAV } from '../nav/showroom-nav.config';

@Component({
  selector: 'sb-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <header class="home__hero">
        <h1>Anatomy Showroom</h1>
        <p>
          Exposition des archétypes d’écran et catalogue des composants
          <code>nf-*</code>. Sidebar configurable · données mock · pas d’auth.
        </p>
      </header>

      @for (section of sections; track section.id) {
        <section class="home__section">
          <h2>{{ section.menu === 'archetypes' ? 'Archetypes' : section.label }}</h2>
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
      .home__hero {
        margin-bottom: 28px;
      }
      .home__hero h1 {
        margin: 0 0 8px;
        font-size: 1.75rem;
      }
      .home__hero p {
        margin: 0;
        max-width: 52rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .home__section {
        margin-bottom: 28px;
      }
      .home__section h2 {
        margin: 0 0 12px;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--nf-text-muted, #6b7280);
      }
      .home__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
      }
      .card {
        display: block;
        padding: 14px;
        border: 1px solid var(--nf-border-subtle, #e2e5ea);
        border-radius: 8px;
        background: var(--nf-bg-elevated, #fff);
        color: inherit;
        text-decoration: none;
      }
      .card:hover {
        border-color: var(--nf-border-strong, #c5cad3);
      }
      .card__top {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
      }
      .card p {
        margin: 8px 0 0;
        font-size: 0.85rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .badge {
        font-size: 0.65rem;
        text-transform: uppercase;
        padding: 1px 6px;
        border-radius: 999px;
        border: 1px solid #d1d5db;
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
  readonly sections = SHOWROOM_NAV;
}
