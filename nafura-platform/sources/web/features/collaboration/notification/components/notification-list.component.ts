/**
 * Notification list – dropdown or full page; list with mark-read.
 */

import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationApiService, NotificationDto } from '../services/notification-api.service';
import { NotificationUnreadService } from '../services/notification-unread.service';

@Component({
  selector: 'nf-notification-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="nf-notification-list">
      @if (loading()) {
        <p class="nf-notification-list__loading">{{ 'notifications.bell.loading' | translate }}</p>
      } @else if (notifications().length === 0) {
        <p class="nf-notification-list__empty">{{ 'notifications.bell.empty' | translate }}</p>
      } @else {
        <ul class="nf-notification-list__ul">
          @for (n of notifications(); track n.id) {
            <li class="nf-notification-list__li" [class.nf-notification-list__li--unread]="!n.isRead">
              <button
                type="button"
                class="nf-notification-list__item"
                (click)="markRead(n)"
              >
                <span class="nf-notification-list__title">{{ n.title }}</span>
                @if (n.body && !compact()) {
                  <p class="nf-notification-list__body">{{ n.body }}</p>
                }
                <time class="nf-notification-list__time">{{ n.sentAt | date:'short' }}</time>
              </button>
            </li>
          }
        </ul>
        @if (!compact()) {
          <div class="nf-notification-list__footer">
            <button type="button" class="nf-notification-list__mark-all" (click)="markAllRead()">
              {{ 'notifications.center.actions.markAllRead' | translate }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .nf-notification-list { padding: 8px 0; }
    .nf-notification-list__loading, .nf-notification-list__empty {
      margin: 0; padding: 12px; color: var(--nf-text-muted); font-size: 0.875rem;
    }
    .nf-notification-list__ul { margin: 0; padding: 0; list-style: none; }
    .nf-notification-list__li { margin: 0; border-bottom: 1px solid var(--nf-border-default, #e5e7eb); }
    .nf-notification-list__li:last-child { border-bottom: none; }
    .nf-notification-list__li--unread { background: var(--nf-surface-hover, #f9fafb); }
    .nf-notification-list__item {
      display: block;
      width: 100%;
      text-align: start;
      border: none;
      padding: 10px 12px;
      background: transparent;
      cursor: pointer;
      color: inherit;
      font: inherit;
    }
    .nf-notification-list__item:hover { background: var(--nf-surface-hover, #f3f4f6); }
    .nf-notification-list__title { font-weight: 500; color: var(--nf-text-primary); }
    .nf-notification-list__body { margin: 4px 0 0; font-size: 0.875rem; color: var(--nf-text-secondary); }
    .nf-notification-list__time { display: block; margin-top: 4px; font-size: 0.75rem; color: var(--nf-text-muted); }
    .nf-notification-list__footer { padding: 8px 12px; border-top: 1px solid var(--nf-border-default); }
    .nf-notification-list__mark-all {
      border: none; background: transparent; color: var(--nf-color-primary-600); cursor: pointer; font-size: 0.875rem;
    }
  `],
})
export class NotificationListComponent {
  private readonly api = inject(NotificationApiService);
  private readonly unreadStore = inject(NotificationUnreadService);

  compact = input<boolean>(false);

  closed = output<void>();

  readonly loading = signal(true);
  readonly notifications = signal<NotificationDto[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listNotifications(0, this.compact() ? 10 : 50).subscribe({
      next: (page) => {
        this.notifications.set(page.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  markRead(n: NotificationDto): void {
    if (n.isRead) return;
    this.api.markNotificationRead(n.id).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
        );
        void this.unreadStore.refresh();
      },
    });
  }

  markAllRead(): void {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.load();
        void this.unreadStore.refresh();
      },
    });
  }
}
