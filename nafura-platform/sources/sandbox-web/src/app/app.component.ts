import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import {
  SHOWROOM_NAV,
  type ShowroomNavSection,
} from './nav/showroom-nav.config';

@Component({
  selector: 'sb-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-shell">
      <aside class="sb-sidebar">
        <header class="sb-sidebar__brand">
          <a routerLink="/" class="sb-sidebar__logo">Anatomy</a>
          <span class="sb-sidebar__tag">Showroom</span>
        </header>

        <nav class="sb-sidebar__nav" aria-label="Showroom">
          @for (menu of menus; track menu.id) {
            <section class="sb-menu">
              <button
                type="button"
                class="sb-menu__title"
                [attr.aria-expanded]="isOpen(menu.id)"
                (click)="toggleMenu(menu.id)"
              >
                <span>{{ menu.label }}</span>
                <span class="sb-menu__chev">{{ isOpen(menu.id) ? '▾' : '▸' }}</span>
              </button>

              @if (isOpen(menu.id)) {
                @for (section of menu.sections; track section.id) {
                  <div class="sb-section">
                    @if (menu.sections.length > 1) {
                      <div class="sb-section__label">{{ section.label }}</div>
                    }
                    <ul class="sb-section__list">
                      @for (item of section.items; track item.id) {
                        <li>
                          <a
                            class="sb-link"
                            [routerLink]="item.route"
                            routerLinkActive="sb-link--active"
                            [routerLinkActiveOptions]="{ exact: false }"
                          >
                            <span class="sb-link__label">{{ item.label }}</span>
                            @if (item.status) {
                              <span
                                class="sb-link__badge"
                                [class.sb-link__badge--live]="item.status === 'live'"
                                [class.sb-link__badge--partial]="item.status === 'partial'"
                                [class.sb-link__badge--stub]="item.status === 'stub'"
                              >
                                {{ item.status }}
                              </span>
                            }
                          </a>
                        </li>
                      }
                    </ul>
                  </div>
                }
              }
            </section>
          }
        </nav>
      </aside>

      <main class="sb-main">
        <header class="sb-topbar">
          <div class="sb-topbar__crumb">{{ currentLabel() }}</div>
          <div class="sb-topbar__hint">mocks · no auth · :4300</div>
        </header>
        <div class="sb-content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .sb-shell {
        display: grid;
        grid-template-columns: 280px 1fr;
        height: 100vh;
        min-height: 100%;
      }
      .sb-sidebar {
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--nf-border-subtle, #e2e5ea);
        background: var(--nf-bg-elevated, #fff);
        overflow: auto;
      }
      .sb-sidebar__brand {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 18px 16px 12px;
        border-bottom: 1px solid var(--nf-border-subtle, #e2e5ea);
      }
      .sb-sidebar__logo {
        font-weight: 700;
        font-size: 1.15rem;
        color: inherit;
        text-decoration: none;
      }
      .sb-sidebar__tag {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--nf-text-muted, #6b7280);
      }
      .sb-sidebar__nav {
        padding: 8px 0 24px;
      }
      .sb-menu__title {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px 6px;
        border: 0;
        background: transparent;
        font: inherit;
        font-weight: 700;
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--nf-text-muted, #6b7280);
        cursor: pointer;
      }
      .sb-menu__chev {
        font-size: 0.75rem;
      }
      .sb-section__label {
        padding: 8px 16px 4px;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--nf-text-muted, #6b7280);
      }
      .sb-section__list {
        list-style: none;
        margin: 0;
        padding: 0 8px 8px;
      }
      .sb-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 6px;
        color: inherit;
        text-decoration: none;
        font-size: 0.875rem;
      }
      .sb-link:hover {
        background: var(--nf-bg-hover, #f3f4f6);
      }
      .sb-link--active {
        background: var(--nf-bg-selected, #e8eefc);
        font-weight: 600;
      }
      .sb-link__badge {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 1px 6px;
        border-radius: 999px;
        border: 1px solid var(--nf-border-subtle, #d1d5db);
        color: var(--nf-text-muted, #6b7280);
      }
      .sb-link__badge--live {
        border-color: #86efac;
        color: #166534;
        background: #f0fdf4;
      }
      .sb-link__badge--partial {
        border-color: #fcd34d;
        color: #92400e;
        background: #fffbeb;
      }
      .sb-link__badge--stub {
        opacity: 0.8;
      }
      .sb-main {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
      }
      .sb-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 10px 20px;
        border-bottom: 1px solid var(--nf-border-subtle, #e2e5ea);
        background: var(--nf-bg-elevated, #fff);
      }
      .sb-topbar__crumb {
        font-weight: 600;
        font-size: 0.9rem;
      }
      .sb-topbar__hint {
        font-size: 0.75rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .sb-content {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 20px;
      }
    `,
  ],
})
export class AppComponent {
  private readonly router = inject(Router);

  /** Big menus — Archetypes exposition + Components catalog */
  readonly menus = [
    {
      id: 'archetypes' as const,
      label: 'Archetypes',
      sections: SHOWROOM_NAV.filter((s) => s.menu === 'archetypes'),
    },
    {
      id: 'components' as const,
      label: 'Components',
      sections: SHOWROOM_NAV.filter((s) => s.menu === 'components'),
    },
  ];

  private readonly openMenus = signal<Record<string, boolean>>({
    archetypes: true,
    components: true,
  });

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly currentLabel = computed(() => {
    const u = this.url();
    for (const section of SHOWROOM_NAV) {
      for (const item of section.items) {
        if (item.route && u.startsWith(item.route.split('?')[0])) {
          return item.label;
        }
      }
    }
    if (u === '/' || u.startsWith('/?')) return 'Catalogue';
    return 'Showroom';
  });

  isOpen(menuId: string): boolean {
    return !!this.openMenus()[menuId];
  }

  toggleMenu(menuId: string): void {
    this.openMenus.update((m) => ({ ...m, [menuId]: !m[menuId] }));
  }

  /** Exposed for tests / future settings panel */
  sections(): ShowroomNavSection[] {
    return SHOWROOM_NAV;
  }
}
