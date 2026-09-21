import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { PlatformNotificationPanelComponent } from './notification-panel.component';
import { PlatformNotificationsService } from './notifications.service';

@Component({
  selector: 'nf-platform-notification-bell',
  standalone: true,
  imports: [LucideAngularModule, PlatformNotificationPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-platform-notification-bell">
      <button
        type="button"
        class="nf-platform-notification-bell__button"
        aria-label="Notifications"
        [attr.aria-expanded]="open()"
        (click)="toggle()">
        <lucide-icon name="bell" [size]="19" aria-hidden="true"></lucide-icon>
        @if (notifications.unreadCount() > 0) {
          <span class="nf-platform-notification-bell__badge">
            {{ notifications.unreadCount() > 99 ? '99+' : notifications.unreadCount() }}
          </span>
        }
      </button>

      @if (open()) {
        <nf-platform-notification-panel (closed)="close()" />
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .nf-platform-notification-bell { position: relative; }
    .nf-platform-notification-bell__button {
      position: relative;
      display: inline-grid;
      width: 36px;
      height: 36px;
      place-items: center;
      border: 0;
      border-radius: 6px;
      color: var(--nf-text-secondary, #475569);
      background: transparent;
      cursor: pointer;
    }
    .nf-platform-notification-bell__button:hover { background: var(--nf-surface-hover, #f1f5f9); }
    .nf-platform-notification-bell__badge {
      position: absolute;
      top: 1px;
      inset-inline-end: 0;
      min-width: 16px;
      height: 16px;
      padding: 0 3px;
      border-radius: 8px;
      color: #fff;
      background: var(--nf-color-danger-600, #dc2626);
      font-size: 0.625rem;
      line-height: 16px;
      text-align: center;
    }
    nf-platform-notification-panel {
      position: absolute;
      top: calc(100% + 6px);
      inset-inline-end: 0;
      z-index: 100;
      width: min(360px, calc(100vw - 24px));
      overflow: hidden;
      border: 1px solid var(--nf-border-default, #e2e8f0);
      border-radius: 8px;
      background: var(--nf-color-surface, #fff);
      box-shadow: 0 12px 30px rgb(15 23 42 / 14%);
    }
  `],
})
export class PlatformNotificationBellComponent {
  readonly notifications = inject(PlatformNotificationsService);
  readonly open = signal(false);

  constructor() {
    this.notifications.initialize();
  }

  @HostListener('document:click', ['$event'])
  closeFromOutside(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target && !target.closest('.nf-platform-notification-bell')) this.close();
  }

  toggle(): void {
    this.open.update((value) => !value);
  }
  close(): void { this.open.set(false); }
}
