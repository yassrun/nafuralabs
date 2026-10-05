import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { formatRelativeTime } from '../../lib/anatomy/utils/relative-time';
import { PlatformNotificationsService } from './notifications.service';
import type { PlatformNotification } from './notifications.types';

@Component({
  selector: 'nf-platform-notification-panel',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf-platform-notification-panel" aria-label="Notifications">
      <header class="nf-platform-notification-panel__header">
        <strong>{{ 'notifications.bell.title' | translate }}</strong>
        @if (notifications.unreadCount() > 0) {
          <button type="button" class="nf-platform-notification-panel__mark-read" (click)="markAllRead()">
            {{ 'notifications.bell.markAllRead' | translate }}
          </button>
        }
      </header>

      <div class="nf-platform-notification-panel__list">
        @if (notifications.loading()) {
          <p class="nf-platform-notification-panel__empty">{{ 'notifications.bell.loading' | translate }}</p>
        } @else if (notifications.error()) {
          <div class="nf-platform-notification-panel__error">
            <p>{{ notifications.error() }}</p>
            <button type="button" (click)="retry()">{{ 'notifications.center.retry' | translate }}</button>
          </div>
        } @else if (notifications.notifications().length === 0) {
          <p class="nf-platform-notification-panel__empty">{{ 'notifications.bell.empty' | translate }}</p>
        } @else {
          @for (notification of notifications.notifications(); track notification.id) {
          <button
            type="button"
            class="nf-platform-notification-panel__item"
            [class.nf-platform-notification-panel__item--unread]="!notification.read"
            (click)="openNotification(notification)">
            @if (notification.sourceLabel) {
              <span class="nf-platform-notification-panel__source">{{ notification.sourceLabel }}</span>
            }
            <span class="nf-platform-notification-panel__item-title">{{ notification.title }}</span>
            @if (notification.createdAt) {
              <span class="nf-platform-notification-panel__item-message">{{ relative(notification.createdAt) }}</span>
            }
          </button>
          }
        }
      </div>

      <footer class="nf-platform-notification-panel__footer">
        <a routerLink="/notifications" (click)="closed.emit()">{{ 'notifications.bell.viewAll' | translate }}</a>
      </footer>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nf-platform-notification-panel {
      width: min(360px, calc(100vw - 24px));
      overflow: hidden;
      border: 1px solid var(--nf-border-default, #e2e8f0);
      border-radius: 8px;
      background: var(--nf-color-surface, #fff);
      box-shadow: 0 12px 30px rgb(15 23 42 / 14%);
    }
    .nf-platform-notification-panel__header,
    .nf-platform-notification-panel__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid var(--nf-border-default, #e2e8f0);
    }
    .nf-platform-notification-panel__footer {
      border-top: 1px solid var(--nf-border-default, #e2e8f0);
      border-bottom: 0;
      justify-content: flex-end;
    }
    .nf-platform-notification-panel__mark-read {
      border: 0;
      background: transparent;
      color: var(--nf-color-primary-700, #1d4ed8);
      cursor: pointer;
      font-size: 0.75rem;
    }
    .nf-platform-notification-panel__list { max-height: 320px; overflow: auto; }
    .nf-platform-notification-panel__item {
      display: flex;
      width: 100%;
      flex-direction: column;
      gap: 3px;
      padding: 11px 12px;
      border: 0;
      border-bottom: 1px solid var(--nf-border-subtle, #f1f5f9);
      background: transparent;
      text-align: start;
      cursor: pointer;
    }
    .nf-platform-notification-panel__item:hover,
    .nf-platform-notification-panel__item--unread { background: var(--nf-color-primary-50, #eff6ff); }
    .nf-platform-notification-panel__source {
      color: var(--nf-color-primary-700, #1d4ed8);
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .nf-platform-notification-panel__item-title { font-size: 0.8125rem; font-weight: 600; }
    .nf-platform-notification-panel__item-message,
    .nf-platform-notification-panel__empty { color: var(--nf-text-muted, #64748b); font-size: 0.75rem; }
    .nf-platform-notification-panel__empty { margin: 0; padding: 24px 12px; text-align: center; }
    .nf-platform-notification-panel__error { padding: 18px 12px; color: var(--nf-color-danger-700, #b91c1c); font-size: 0.75rem; text-align: center; }
    .nf-platform-notification-panel__error p { margin: 0 0 10px; }
    .nf-platform-notification-panel__error button { border: 0; border-radius: 4px; padding: 6px 10px; color: #fff; background: var(--nf-color-danger-600, #dc2626); cursor: pointer; font: inherit; }
    .nf-platform-notification-panel__footer a {
      color: var(--nf-color-primary-700, #1d4ed8);
      font-size: 0.75rem;
      text-decoration: none;
    }
  `],
})
export class PlatformNotificationPanelComponent {
  readonly notifications = inject(PlatformNotificationsService);
  readonly closed = output<void>();

  markAllRead(): void { this.notifications.markAllRead(); }

  retry(): void { void this.notifications.load(); }

  relative(value: string): string {
    return formatRelativeTime(value);
  }

  async openNotification(notification: PlatformNotification): Promise<void> {
    await this.notifications.open(notification);
    this.closed.emit();
  }
}
