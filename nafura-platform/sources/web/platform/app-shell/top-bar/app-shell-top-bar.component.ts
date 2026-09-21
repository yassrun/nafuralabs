import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PlatformNotificationBellComponent } from '../../notifications';

import { TopBarApplicationIdentityComponent } from './top-bar-application-identity.component';
import { TopBarMenuButtonComponent } from './top-bar-menu-button.component';

@Component({
  selector: 'nf-app-shell-top-bar',
  standalone: true,
  imports: [PlatformNotificationBellComponent, TopBarApplicationIdentityComponent, TopBarMenuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="nf-app-shell-top-bar">
      <div class="nf-app-shell-top-bar__start">
        <nf-app-shell-top-bar-menu-button (pressed)="navigationToggle.emit()" />
        <nf-app-shell-top-bar-application-identity [applicationName]="applicationName()" />
      </div>

      <div class="nf-app-shell-top-bar__actions">
        @if (notificationsEnabled()) {
          <nf-platform-notification-bell />
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
  readonly navigationToggle = output<void>();
}
