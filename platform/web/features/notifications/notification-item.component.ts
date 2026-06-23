import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { NotificationItem } from './notifications-api.service';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <article class="notification-item" [class.notification-item--unread]="!notification().isRead">
      <label class="notification-item__check">
        <input type="checkbox" [checked]="selected()" (change)="toggleSelection.emit(notification().id)" />
      </label>

      <button type="button" class="notification-item__content" (click)="open.emit(notification())">
        <header>
          <h3>{{ notification().title }}</h3>
          <span class="notification-item__source">{{ sourceLabel() | translate }}</span>
        </header>
        <p *ngIf="notification().body">{{ notification().body }}</p>
        <time>{{ notification().sentAt | date : 'short' }}</time>
      </button>

      <button
        *ngIf="!notification().isRead"
        type="button"
        class="notification-item__mark"
        (click)="markRead.emit(notification().id)">
        {{ 'notifications.center.actions.markRead' | translate }}
      </button>
    </article>
  `,
  styles: [
    `
      .notification-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.5rem;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-left: 4px solid transparent;
        border-radius: 10px;
        padding: 0.6rem;
        background: var(--nf-color-surface, #fff);
      }
      .notification-item--unread {
        border-left-color: var(--nf-color-primary-500, #3b82f6);
        background: var(--nf-primary-subtle, #eff6ff);
      }
      .notification-item__content {
        border: 0;
        background: transparent;
        text-align: left;
        padding: 0;
        cursor: pointer;
      }
      .notification-item__content h3 {
        margin: 0;
        font-size: 0.95rem;
      }
      .notification-item__content p {
        margin: 0.25rem 0;
        color: var(--nf-text-muted, #6b7280);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .notification-item__source {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--nf-text-muted, #6b7280);
      }
      .notification-item header {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .notification-item time {
        font-size: 0.75rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .notification-item__mark {
        align-self: center;
      }
      .notification-item__check {
        align-self: start;
      }
    `,
  ],
})
export class NotificationItemComponent {
  readonly notification = input.required<NotificationItem>();
  readonly selected = input(false);

  readonly open = output<NotificationItem>();
  readonly markRead = output<string>();
  readonly toggleSelection = output<string>();

  sourceLabel(): string {
    switch ((this.notification().source || 'system').toLowerCase()) {
      case 'workflow':
        return 'notifications.center.filters.source.workflow';
      case 'assignment':
        return 'notifications.center.filters.source.assignment';
      case 'mention':
        return 'notifications.center.filters.source.mention';
      case 'system':
      default:
        return 'notifications.center.filters.source.system';
    }
  }
}
