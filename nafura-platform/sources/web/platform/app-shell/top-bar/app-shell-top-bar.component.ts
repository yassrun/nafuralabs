import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AiToggleWidget } from '../../../core/shell/widgets/ai-toggle.widget';
import { TenantMenuWidget } from '../../../core/shell/widgets/tenant-menu.widget';
import { UserMenuWidget } from '../../../core/shell/widgets/user-menu.widget';
import { PlatformNotificationBellComponent } from '../../notifications';

import { TopBarApplicationIdentityComponent } from './top-bar-application-identity.component';
import { TopBarMenuButtonComponent } from './top-bar-menu-button.component';

@Component({
  selector: 'nf-app-shell-top-bar',
  standalone: true,
  imports: [
    PlatformNotificationBellComponent,
    TopBarApplicationIdentityComponent,
    TopBarMenuButtonComponent,
    AiToggleWidget,
    TenantMenuWidget,
    UserMenuWidget,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="nf-app-shell-top-bar">
      <div class="nf-app-shell-top-bar__start">
        <nf-app-shell-top-bar-menu-button (pressed)="navigationToggle.emit()" />
        <nf-app-shell-top-bar-application-identity [applicationName]="applicationName()" />
      </div>

      <div class="nf-app-shell-top-bar__actions">
        @if (tenantMenu()) {
          <nf-tenant-menu
            [tenantSettingsEnabled]="tenantSettings()"
            [tenantSettingsRoute]="tenantSettingsRoute()"
            [organizationIdentityEnabled]="organizationIdentity()"
            [organizationIdentityRoute]="organizationIdentityRoute()"
            [fallbackName]="tenantFallbackName()"
            [fallbackKey]="tenantFallbackKey()" />
        }
        @if (notificationsEnabled()) {
          <nf-platform-notification-bell />
        }
        @if (aiEnabled()) {
          <nf-ai-toggle />
        }
        @if (userMenu()) {
          <nf-user-menu
            [userSettingsEnabled]="userSettings()"
            [userSettingsRoute]="userSettingsRoute()" />
        }
        <ng-content select="[app-shell-topbar]" />
      </div>
    </header>
  `,
  styles: [`
    :host { display: contents; }
    .nf-app-shell-top-bar {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 16px;
      background: var(--nf-color-surface, #ffffff);
      border-bottom: 1px solid var(--nf-border-default, #e2e8f0);
      z-index: 20;
    }
    .nf-app-shell-top-bar__start {
      display: flex;
      align-items: center;
      min-width: 0;
      gap: 8px;
    }
    .nf-app-shell-top-bar__actions {
      display: flex;
      align-items: center;
      min-width: 0;
      gap: 8px;
    }
  `],
})
export class AppShellTopBarComponent {
  readonly applicationName = input.required<string>();
  readonly notificationsEnabled = input(false);
  /** When true, shows `nf-ai-toggle` between notifications and the user menu. */
  readonly aiEnabled = input(false);
  readonly userMenu = input(false);
  readonly userSettings = input(false);
  readonly userSettingsRoute = input('/user-settings');
  readonly tenantMenu = input(false);
  readonly tenantSettings = input(true);
  readonly tenantSettingsRoute = input('/organization/settings');
  readonly organizationIdentity = input(true);
  readonly organizationIdentityRoute = input('/organization/identity');
  readonly tenantFallbackName = input('Organisation');
  readonly tenantFallbackKey = input('');
  readonly navigationToggle = output<void>();
}
