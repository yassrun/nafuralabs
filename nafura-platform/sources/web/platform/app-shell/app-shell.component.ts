import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { AppShellSidebarComponent } from './sidebar/app-shell-sidebar.component';
import { AppShellTopBarComponent } from './top-bar/app-shell-top-bar.component';
import { AppShellNavigationSection } from './app-shell.types';
import { APP_SHELL_CONFIG } from './app-shell.config';

@Component({
  selector: 'nf-app-shell',
  standalone: true,
  imports: [AppShellTopBarComponent, AppShellSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-app-shell">
      <nf-app-shell-top-bar
        [applicationName]="resolvedApplicationName()"
        [notificationsEnabled]="notificationsEnabled()"
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
        [applicationName]="resolvedApplicationName()"
        [navigation]="resolvedNavigation()"
        [mobileOpen]="mobileNavOpen()"
        (navigationSelected)="closeNavigation()">
        <ng-content select="[app-shell-organization]" />
        <ng-content select="[app-shell-sidebar-footer]" />
      </nf-app-shell-sidebar>

      <main class="nf-app-shell__content">
        <ng-content />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .nf-app-shell {
      --nf-app-shell-sidebar-width: 272px;
      --nf-app-shell-topbar-height: 56px;
      display: grid;
      grid-template-columns: var(--nf-app-shell-sidebar-width) minmax(0, 1fr);
      grid-template-rows: var(--nf-app-shell-topbar-height) minmax(0, 1fr);
      min-height: 100dvh;
      background: var(--nf-surface-page, #f8fafc);
      color: var(--nf-text-primary, #172033);
    }
    .nf-app-shell__content {
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }
    .nf-app-shell__backdrop { display: none; }
    @media (max-width: 800px) {
      .nf-app-shell { grid-template-columns: minmax(0, 1fr); }
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
  readonly applicationName = input<string | undefined>();
  readonly navigation = input<readonly AppShellNavigationSection[] | undefined>();
  readonly resolvedApplicationName = computed(
    () => this.applicationName() ?? this.config.product.name,
  );
  readonly resolvedNavigation = computed(
    () => this.navigation() ?? this.config.sidebar.navigation,
  );
  readonly notificationsEnabled = computed(
    () => this.config.notifications?.enabled ?? false,
  );
  readonly mobileNavOpen = signal(false);

  toggleNavigation(): void {
    this.mobileNavOpen.update((isOpen) => !isOpen);
  }

  closeNavigation(): void {
    this.mobileNavOpen.set(false);
  }
}
