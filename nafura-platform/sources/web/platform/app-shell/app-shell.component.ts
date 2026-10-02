import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AiPanelService } from '../../core/shell/ai-panel.service';
import { findActiveLabel } from '../../core/navigation/sidebar-tree';
import { AppShellAiPanelComponent } from './ai/app-shell-ai-panel.component';
import { AppShellSidebarComponent } from './sidebar/app-shell-sidebar.component';
import { AppShellTopBarComponent } from './top-bar/app-shell-top-bar.component';
import { AppShellNavigationSection } from './app-shell.types';
import { APP_SHELL_CONFIG, APP_SHELL_ACCESS } from './app-shell.config';
import { toSidebar, visibleNavigation } from './navigation-access';

/**
 * Platform shell: the sidebar holds the product identity, the navigation and the person;
 * the top bar tells where you are and holds the organization, notifications and assistant.
 */
@Component({
  selector: 'nf-app-shell',
  standalone: true,
  imports: [AppShellTopBarComponent, AppShellSidebarComponent, AppShellAiPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="nf-app-shell"
      [class.nf-app-shell--ai-open]="aiOpen()"
      [class.nf-app-shell--nav-collapsed]="navCollapsed()">
      <nf-app-shell-top-bar
        [title]="pageTitle()"
        [notificationsEnabled]="notificationsEnabled()"
        [aiEnabled]="aiEnabled()"
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

      @if (mobileNavOpen()) {
        <button
          type="button"
          class="nf-app-shell__backdrop"
          aria-label="Fermer la navigation"
          (click)="closeNavigation()"></button>
      }

      <nf-app-shell-sidebar
        [product]="product()"
        [navigation]="resolvedNavigation()"
        [mobileOpen]="mobileNavOpen()"
        [collapsed]="navCollapsed()"
        [userMenu]="userMenuEnabled()"
        [userSettings]="userSettingsEnabled()"
        [userSettingsRoute]="userSettingsRoute()"
        (expandRequest)="navCollapsed.set(false)"
        (navigationSelected)="closeNavigation()">
        <ng-content select="[app-shell-organization]" />
        <ng-content select="[app-shell-sidebar-footer]" />
      </nf-app-shell-sidebar>

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
      display: grid;
      grid-template-columns: var(--nf-app-shell-sidebar-width) minmax(0, 1fr) 0;
      grid-template-rows: var(--nf-app-shell-topbar-height) minmax(0, 1fr);
      height: 100dvh;
      overflow: hidden;
      background: var(--nf-surface-page, #f8fafc);
      color: var(--nf-text-primary, #172033);
      transition: grid-template-columns 200ms ease;
    }
    .nf-app-shell--ai-open {
      grid-template-columns:
        var(--nf-app-shell-sidebar-width)
        minmax(0, 1fr)
        var(--nf-app-shell-ai-width);
    }
    .nf-app-shell--nav-collapsed {
      --nf-app-shell-sidebar-width: 64px;
    }
    .nf-app-shell__content {
      grid-row: 2;
      grid-column: 2;
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }
    .nf-app-shell__backdrop { display: none; }
    @media (max-width: 800px) {
      .nf-app-shell,
      .nf-app-shell--ai-open {
        grid-template-columns: minmax(0, 1fr);
      }
      .nf-app-shell__content {
        grid-column: 1;
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
  private readonly router = inject(Router);
  private readonly access = inject(APP_SHELL_ACCESS, { optional: true });

  readonly applicationName = input<string | undefined>();
  readonly navigation = input<readonly AppShellNavigationSection[] | undefined>();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly product = computed(() => ({ ...this.config.product, name: this.applicationName() ?? this.config.product.name }));
  readonly resolvedNavigation = computed(() => {
    const sections = this.navigation() ?? this.config.sidebar.navigation;
    return this.access ? visibleNavigation(sections, this.access()) : sections;
  });
  /** The screen the user is on, from the navigation entry matching the URL. */
  readonly pageTitle = computed(() => {
    const fallback = this.product().name;
    if (this.config.topBar?.pageContext === false) return fallback;
    return findActiveLabel(toSidebar(this.resolvedNavigation()).nodes, this.url()) ?? fallback;
  });
  readonly notificationsEnabled = computed(() => this.config.notifications?.enabled ?? false);
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
  readonly tenantSettingsEnabled = computed(() => this.config.tenantMenu?.tenantSettings ?? true);
  readonly tenantSettingsRoute = computed(
    () => this.config.tenantMenu?.tenantSettingsRoute ?? '/organization/settings',
  );
  readonly organizationIdentityEnabled = computed(
    () => this.config.tenantMenu?.organizationIdentity ?? true,
  );
  readonly organizationIdentityRoute = computed(
    () => this.config.tenantMenu?.organizationIdentityRoute ?? '/organization/identity',
  );
  readonly tenantFallbackName = computed(() => this.config.tenantMenu?.fallbackName ?? 'Organisation');
  readonly tenantFallbackKey = computed(() => this.config.tenantMenu?.fallbackKey ?? '');
  readonly mobileNavOpen = signal(false);
  /** Same gesture as Sektor: the menu button collapses the sidebar to icons (drawer on mobile). */
  readonly navCollapsed = signal(false);

  constructor() {
    this.aiPanel.syncFromOptions({
      enabled: this.config.ai?.enabled ?? false,
      initiallyOpen: this.config.ai?.initiallyOpen ?? false,
    });
  }

  toggleNavigation(): void {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches) {
      this.mobileNavOpen.update((isOpen) => !isOpen);
      return;
    }
    this.navCollapsed.update((collapsed) => !collapsed);
  }

  closeNavigation(): void {
    this.mobileNavOpen.set(false);
  }
}
