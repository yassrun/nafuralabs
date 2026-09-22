import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AiPanelService } from '../../core/shell/ai-panel.service';
import { AppShellAiPanelComponent } from './ai/app-shell-ai-panel.component';
import { AppShellContextRailComponent } from './context-rail.component';
import { AppShellContextRailService } from './context-rail.service';
import { AppShellSidebarComponent } from './sidebar/app-shell-sidebar.component';
import { AppShellTopBarComponent } from './top-bar/app-shell-top-bar.component';
import { AppShellNavigationSection } from './app-shell.types';
import { APP_SHELL_CONFIG } from './app-shell.config';

@Component({
  selector: 'nf-app-shell',
  standalone: true,
  imports: [
    AppShellTopBarComponent,
    AppShellContextRailComponent,
    AppShellSidebarComponent,
    AppShellAiPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="nf-app-shell"
      [class.nf-app-shell--ai-open]="aiOpen()"
      [class.nf-app-shell--rail]="railEnabled()"
      [class.nf-app-shell--nav-collapsed]="navCollapsed()">
      <nf-app-shell-top-bar
        [applicationName]="resolvedApplicationName()"
        [notificationsEnabled]="notificationsEnabled()"
        [aiEnabled]="aiEnabled()"
        [userMenu]="userMenuEnabled()"
        [userSettings]="userSettingsEnabled()"
        [userSettingsRoute]="userSettingsRoute()"
        [tenantMenu]="tenantMenuEnabled()"
        [tenantSettings]="tenantSettingsEnabled()"
        [tenantSettingsRoute]="tenantSettingsRoute()"
        [organizationIdentity]="organizationIdentityEnabled()"
        [organizationIdentityRoute]="organizationIdentityRoute()"
        [tenantFallbackName]="tenantFallbackName()"
        [tenantFallbackKey]="tenantFallbackKey()"
        (navigationToggle)="toggleNavigation()">
        <ng-content select="[app-shell-topbar]" />
      </nf-app-shell-top-bar>

      @if (mobileNavOpen() && !railEnabled()) {
        <button
          type="button"
          class="nf-app-shell__backdrop"
          aria-label="Fermer la navigation"
          (click)="closeNavigation()"></button>
      }

      @if (railEnabled()) {
        <nf-app-shell-context-rail
          [collapsed]="navCollapsed()"
          [applicationName]="resolvedApplicationName()"
          [adminNavigation]="adminNavigation()"
          (expandSidebar)="navCollapsed.set(false)" />
      } @else {
        <nf-app-shell-sidebar
          [applicationName]="resolvedApplicationName()"
          [navigation]="resolvedNavigation()"
          [mobileOpen]="mobileNavOpen()"
          [userMenu]="userMenuEnabled()"
          (navigationSelected)="closeNavigation()">
          <ng-content select="[app-shell-organization]" />
          <ng-content select="[app-shell-sidebar-footer]" />
        </nf-app-shell-sidebar>
      }

      <main class="nf-app-shell__content">
        <ng-content />
      </main>

      @if (aiEnabled()) {
        <nf-app-shell-ai-panel />
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .nf-app-shell {
      --nf-app-shell-sidebar-width: 272px;
      --nf-app-shell-topbar-height: 56px;
      --nf-app-shell-ai-width: 360px;
      --nf-app-shell-rail-width: 0px;
      display: grid;
      grid-template-columns: var(--nf-app-shell-sidebar-width) minmax(0, 1fr) 0;
      grid-template-rows: var(--nf-app-shell-topbar-height) minmax(0, 1fr);
      height: 100dvh;
      overflow: hidden;
      background: var(--nf-surface-page, #f8fafc);
      color: var(--nf-text-primary, #172033);
    }
    .nf-app-shell--ai-open {
      grid-template-columns:
        var(--nf-app-shell-sidebar-width)
        minmax(0, 1fr)
        var(--nf-app-shell-ai-width);
    }
    .nf-app-shell--rail {
      --nf-app-shell-rail-width: 260px;
      grid-template-columns: var(--nf-app-shell-rail-width) minmax(0, 1fr) 0;
      transition: grid-template-columns 200ms ease;
    }
    .nf-app-shell--rail.nf-app-shell--nav-collapsed {
      --nf-app-shell-rail-width: 64px;
    }
    .nf-app-shell--rail.nf-app-shell--ai-open {
      grid-template-columns:
        var(--nf-app-shell-rail-width)
        minmax(0, 1fr)
        var(--nf-app-shell-ai-width);
    }
    .nf-app-shell__content {
      grid-row: 2;
      grid-column: 2;
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }
    .nf-app-shell--rail .nf-app-shell__content {
      grid-column: 2;
    }
    .nf-app-shell__backdrop { display: none; }
    .nf-app-shell--nav-open:not(.nf-app-shell--rail) .nf-app-shell__backdrop {
      display: block;
      position: fixed;
      grid-column: 1;
      grid-row: 1;
      inset: var(--nf-app-shell-topbar-height) 0 0 0;
      z-index: 25;
      border: 0;
      padding: 0;
      background: rgb(15 23 42 / 42%);
    }
    @media (max-width: 800px) {
      .nf-app-shell,
      .nf-app-shell--ai-open {
        grid-template-columns: minmax(0, 1fr);
      }
      .nf-app-shell--rail,
      .nf-app-shell--rail.nf-app-shell--ai-open {
        grid-template-columns: var(--nf-app-shell-rail-width, 56px) minmax(0, 1fr);
      }
      .nf-app-shell:not(.nf-app-shell--rail) .nf-app-shell__content {
        grid-column: 1;
      }
      .nf-app-shell--rail .nf-app-shell__content {
        grid-column: 2;
      }
      .nf-app-shell__backdrop {
        display: block;
        position: fixed;
        inset: var(--nf-app-shell-topbar-height) 0 0;
        border: 0;
        padding: 0;
        background: rgb(15 23 42 / 42%);
        z-index: 25;
      }
    }
  `],
})
export class AppShellComponent {
  private readonly config = inject(APP_SHELL_CONFIG);
  private readonly aiPanel = inject(AiPanelService);
  private readonly rail = inject(AppShellContextRailService);
  private readonly router = inject(Router);

  readonly applicationName = input<string | undefined>();
  readonly navigation = input<readonly AppShellNavigationSection[] | undefined>();
  readonly resolvedApplicationName = computed(
    () => this.applicationName() ?? this.config.product.name,
  );
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly railEnabled = this.rail.railEnabled;
  readonly adminNavigation = computed(() => this.config.sidebar.navigation);
  readonly resolvedNavigation = computed(() => {
    if (this.navigation()) return this.navigation()!;
    return this.navigationForActiveSlot() ?? this.config.sidebar.navigation;
  });
  readonly notificationsEnabled = computed(
    () => this.config.notifications?.enabled ?? false,
  );
  readonly aiEnabled = computed(() => this.config.ai?.enabled ?? false);
  readonly aiOpen = computed(() => this.aiEnabled() && this.aiPanel.open());
  readonly userMenuEnabled = computed(
    () => this.config.userMenu?.enabled ?? this.config.sidebar.userMenu !== false,
  );
  readonly userSettingsEnabled = computed(() => this.config.userMenu?.userSettings ?? false);
  readonly userSettingsRoute = computed(
    () => this.config.userMenu?.userSettingsRoute ?? '/user-settings',
  );
  readonly tenantMenuEnabled = computed(() => this.config.tenantMenu?.enabled ?? false);
  readonly tenantSettingsEnabled = computed(
    () => this.config.tenantMenu?.tenantSettings ?? true,
  );
  readonly tenantSettingsRoute = computed(
    () => this.config.tenantMenu?.tenantSettingsRoute ?? '/organization/settings',
  );
  readonly organizationIdentityEnabled = computed(
    () => this.config.tenantMenu?.organizationIdentity ?? true,
  );
  readonly organizationIdentityRoute = computed(
    () => this.config.tenantMenu?.organizationIdentityRoute ?? '/organization/identity',
  );
  readonly tenantFallbackName = computed(
    () => this.config.tenantMenu?.fallbackName ?? 'Organisation',
  );
  readonly tenantFallbackKey = computed(() => this.config.tenantMenu?.fallbackKey ?? '');
  readonly mobileNavOpen = signal(false);
  /** Same gesture as Sektor: sandwich collapses the single sidebar to icons. */
  readonly navCollapsed = signal(false);

  constructor() {
    this.aiPanel.syncFromOptions({
      enabled: this.config.ai?.enabled ?? false,
      initiallyOpen: this.config.ai?.initiallyOpen ?? false,
    });
    effect(() => {
      const path = this.url().split('?')[0];
      const slot = this.rail
        .slots()
        .find((entry) => path === entry.route || path.startsWith(entry.route + '/'));
      if (slot && !slot.enabled) {
        void this.router.navigateByUrl(this.rail.admin()?.route || '/');
      }
    });
  }

  toggleNavigation(): void {
    if (this.rail.railEnabled()) {
      this.navCollapsed.update((collapsed) => !collapsed);
      return;
    }
    this.mobileNavOpen.update((isOpen) => !isOpen);
  }

  closeNavigation(): void {
    this.mobileNavOpen.set(false);
  }

  private navigationForActiveSlot(): readonly AppShellNavigationSection[] | null {
    if (!this.rail.railEnabled()) return null;
    const path = this.url().split('?')[0];
    const slot = this.rail
      .visibleSlots()
      .find((entry) => path === entry.route || path.startsWith(entry.route + '/'));
    return slot?.navigation ?? null;
  }
}
