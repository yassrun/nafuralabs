import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { PlatformNotificationsService } from './notifications.service';

@Component({
  selector: 'nf-platform-notification-panel',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf-platform-notification-panel" aria-label="Notifications">
      <header class="nf-platform-notification-panel__header">
        <strong>Notifications</strong>
        @if (notifications.unreadCount() > 0) {
          <button type="button" class="nf-platform-notification-panel__mark-read" (click)="markAllRead()">
            Tout lire
          </button>
        }
      </header>

      <div class="nf-platform-notification-panel__list">
        @if (notifications.loading()) {
          <p class="nf-platform-notification-panel__empty">Chargement...</p>
        } @else if (notifications.error()) {
          <div class="nf-platform-notification-panel__error">
            <p>{{ notifications.error() }}</p>
            <button type="button" (click)="retry()">Réessayer</button>
          </div>
        } @else if (notifications.notifications().length === 0) {
          <p class="nf-platform-notification-panel__empty">Aucune notification</p>
        } @else {
          @for (notification of notifications.notifications(); track notification.id) {
          <button
            type="button"
            class="nf-platform-notification-panel__item"
            [class.nf-platform-notification-panel__item--unread]="!notification.read"
            (click)="openNotification(notification.id, notification.route)">
            <span class="nf-platform-notification-panel__item-title">{{ notification.title }}</span>
            @if (notification.message) {
              <span class="nf-platform-notification-panel__item-message">{{ notification.message }}</span>
            }
          </button>
          }
        }
      </div>

      <footer class="nf-platform-notification-panel__footer">
        <a routerLink="/notifications" (click)="closed.emit()">Voir tout</a>
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
  private readonly router = inject(Router);
  readonly closed = output<void>();

  markAllRead(): void { this.notifications.markAllRead(); }
  markRead(id: string): void { this.notifications.markRead(id); }

  retry(): void { void this.notifications.load(); }

  async openNotification(id: string, route?: string): Promise<void> {
    await this.notifications.markRead(id);
    if (route) {
      await this.router.navigateByUrl(route);
      this.closed.emit();
    }
  }
}
