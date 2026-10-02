import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SidebarNavComponent } from '../../../core/navigation/sidebar-nav.component';
import { UserMenuWidget } from '../../../core/shell/widgets/user-menu.widget';
import type { AppShellProductConfig } from '../app-shell.config';
import { AppShellNavigationSection } from '../app-shell.types';
import { toSidebar } from '../navigation-access';

@Component({
  selector: 'nf-app-shell-sidebar',
  standalone: true,
  imports: [RouterLink, SidebarNavComponent, UserMenuWidget],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="nf-app-shell-sidebar"
      [class.nf-app-shell-sidebar--mobile-open]="mobileOpen()"
      [class.nf-app-shell-sidebar--collapsed]="collapsed()"
      aria-label="Navigation">
      <div class="nf-app-shell-sidebar__brand">
        <a class="nf-app-shell-sidebar__home" [routerLink]="homeRoute()" [attr.aria-label]="product().name" [attr.title]="collapsed() ? product().name : null">
          @if (product().logo && !collapsed()) {
            <img class="nf-app-shell-sidebar__logo" [src]="product().logo" alt="" />
          } @else {
            @if (product().mark) {
              <img class="nf-app-shell-sidebar__mark" [src]="product().mark" alt="" />
            } @else {
              <span class="nf-app-shell-sidebar__mark nf-app-shell-sidebar__mark--initial" aria-hidden="true">{{ initial() }}</span>
            }
            <span class="nf-app-shell-sidebar__application-name">{{ product().name }}</span>
          }
        </a>
        <ng-content select="[app-shell-organization]" />
      </div>

      <nf-sidebar-nav
        class="nf-app-shell-sidebar__navigation"
        [nodes]="sidebar().nodes"
        [zones]="sidebar().zones"
        [collapsed]="collapsed()"
        emptyLabel="Aucun écran disponible"
        (expandRequest)="expandRequest.emit()"
        (navigated)="navigationSelected.emit()" />

      <footer class="nf-app-shell-sidebar__footer naf-shell__sidebar-footer">
        @if (userMenu()) {
          <nf-user-menu
            [compact]="collapsed()"
            [userSettingsEnabled]="userSettings()"
            [userSettingsRoute]="userSettingsRoute()" />
        }
        <ng-content select="[app-shell-sidebar-footer]" />
      </footer>
    </aside>
  `,
  styles: [`
    :host { display: block; grid-row: 1 / span 2; grid-column: 1; min-height: 0; height: 100%; overflow: hidden; }
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
      flex: 0 0 auto;
      gap: 8px;
      height: var(--nf-app-shell-topbar-height, 56px);
      padding: 0 16px;
      border-bottom: 1px solid var(--nf-border-default, #e2e8f0);
      box-sizing: border-box;
    }
    .nf-app-shell-sidebar__home {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      color: inherit;
      text-decoration: none;
      border-radius: 8px;
    }
    .nf-app-shell-sidebar__home:focus-visible {
      outline: 2px solid var(--nf-color-primary, #3b82f6);
      outline-offset: 2px;
    }
    .nf-app-shell-sidebar__mark {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      border-radius: 7px;
      object-fit: contain;
    }
    .nf-app-shell-sidebar__mark--initial {
      display: grid;
      place-items: center;
      background: var(--nf-color-primary, #0d9488);
      color: #fff;
      font-size: 0.875rem;
      font-weight: 800;
    }
    .nf-app-shell-sidebar__logo {
      display: block;
      max-width: 100%;
      max-height: 32px;
      object-fit: contain;
    }
    .nf-app-shell-sidebar__application-name {
      font-size: 0.9375rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nf-app-shell-sidebar__navigation {
      padding: 12px 8px;
    }
    .nf-app-shell-sidebar--collapsed .nf-app-shell-sidebar__brand {
      justify-content: center;
      padding: 0;
    }
    .nf-app-shell-sidebar--collapsed .nf-app-shell-sidebar__application-name {
      display: none;
    }
    .nf-app-shell-sidebar--collapsed .nf-app-shell-sidebar__navigation {
      padding: 12px 6px;
    }
    .nf-app-shell-sidebar__footer {
      flex: 0 0 auto;
      padding: 8px;
      border-top: 1px solid var(--nf-border-default, #e2e8f0);
    }
    .nf-app-shell-sidebar__footer:empty {
      display: none;
    }
    .nf-app-shell-sidebar--collapsed .nf-app-shell-sidebar__footer {
      display: flex;
      justify-content: center;
      padding: 8px 0;
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
  readonly product = input.required<AppShellProductConfig>();
  readonly homeRoute = input('/');
  readonly navigation = input<readonly AppShellNavigationSection[]>([]);
  readonly mobileOpen = input(false);
  /** Icons only (desktop); a click on a domain asks to expand. */
  readonly collapsed = input(false);
  readonly userMenu = input(false);
  readonly userSettings = input(false);
  readonly userSettingsRoute = input('/user-settings');
  readonly navigationSelected = output<void>();
  readonly expandRequest = output<void>();

  readonly sidebar = computed(() => toSidebar(this.navigation()));
  readonly initial = computed(() => this.product().name.trim().charAt(0).toUpperCase());
}
