import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AppShellNavigationSection } from '../app-shell.types';

@Component({
  selector: 'nf-app-shell-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="nf-app-shell-sidebar"
      [class.nf-app-shell-sidebar--mobile-open]="mobileOpen()"
      aria-label="Navigation">
      <div class="nf-app-shell-sidebar__brand">
        <span class="nf-app-shell-sidebar__application-name">{{ applicationName() }}</span>
        <ng-content select="[app-shell-organization]" />
      </div>

      <nav class="nf-app-shell-sidebar__navigation">
        @for (section of navigation(); track section.id) {
          <section class="nf-app-shell-sidebar__navigation-section">
            @if (section.label) {
              <h2 class="nf-app-shell-sidebar__navigation-label">{{ section.label }}</h2>
            }
            @for (item of section.items; track item.id) {
              <a
                class="nf-app-shell-sidebar__navigation-link"
                [routerLink]="item.route"
                routerLinkActive="is-active"
                (click)="navigationSelected.emit()">
                @if (item.icon) {
                  <lucide-icon [name]="item.icon" [size]="18" aria-hidden="true"></lucide-icon>
                }
                <span>{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nf-app-shell-sidebar__navigation-badge">{{ item.badge }}</span>
                }
              </a>
            }
          </section>
        }
      </nav>

      <footer class="nf-app-shell-sidebar__footer naf-shell__sidebar-footer">
        <ng-content select="[app-shell-sidebar-footer]" />
      </footer>
    </aside>
  `,
  styles: [`
    :host { display: block; grid-row: 2; min-height: 0; height: 100%; overflow: hidden; }
    :host(.is-drawer) {
      position: fixed;
      z-index: 40;
      top: var(--nf-app-shell-topbar-height, 56px);
      bottom: 0;
      inset-inline-start: var(--nf-app-shell-rail-width, 56px);
      width: min(var(--nf-app-shell-sidebar-width, 272px), calc(100vw - 56px));
      height: auto;
      grid-row: 1;
      grid-column: 1;
    }
    .nf-app-shell-sidebar {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      background: var(--nf-color-surface, #ffffff);
      border-inline-end: 1px solid var(--nf-border-default, #e2e8f0);
    }
    .nf-app-shell-sidebar__brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 56px;
      padding: 0 16px;
      border-bottom: 1px solid var(--nf-border-default, #e2e8f0);
    }
    .nf-app-shell-sidebar__application-name {
      font-size: 0.9375rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nf-app-shell-sidebar__navigation {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 12px 8px;
    }
    .nf-app-shell-sidebar__navigation-section + .nf-app-shell-sidebar__navigation-section {
      margin-top: 20px;
    }
    .nf-app-shell-sidebar__navigation-label {
      margin: 0;
      padding: 0 8px 6px;
      color: var(--nf-text-muted, #64748b);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .nf-app-shell-sidebar__navigation-link {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 40px;
      padding: 0 8px;
      border-radius: 6px;
      color: inherit;
      font-size: 0.875rem;
      text-decoration: none;
    }
    .nf-app-shell-sidebar__navigation-link:hover {
      background: var(--nf-surface-hover, #f1f5f9);
    }
    .nf-app-shell-sidebar__navigation-link.is-active {
      background: var(--nf-color-primary-50, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
      font-weight: 600;
    }
    .nf-app-shell-sidebar__navigation-badge {
      margin-inline-start: auto;
      color: var(--nf-text-muted, #64748b);
      font-size: 0.75rem;
    }
    .nf-app-shell-sidebar__footer {
      flex: 0 0 auto;
      padding: 12px 8px;
      border-top: 1px solid var(--nf-border-default, #e2e8f0);
    }
    @media (max-width: 800px) {
      :host-context(.nf-app-shell--rail) .nf-app-shell-sidebar {
        inset-inline-start: var(--nf-app-shell-rail-width, 56px);
      }
      .nf-app-shell-sidebar {
        position: fixed;
        top: var(--nf-app-shell-topbar-height, 56px);
        bottom: 0;
        inset-inline-start: 0;
        width: min(var(--nf-app-shell-sidebar-width, 272px), 88vw);
        height: auto;
        transform: translateX(-100%);
        transition: transform 180ms ease;
        z-index: 30;
        box-shadow: 4px 0 20px rgb(15 23 42 / 16%);
      }
      .nf-app-shell-sidebar--mobile-open {
        transform: translateX(0);
      }
    }
  `],
})
export class AppShellSidebarComponent {
  readonly applicationName = input.required<string>();
  readonly navigation = input<readonly AppShellNavigationSection[]>([]);
  readonly mobileOpen = input(false);
  readonly userMenu = input(false);
  readonly navigationSelected = output<void>();
}
