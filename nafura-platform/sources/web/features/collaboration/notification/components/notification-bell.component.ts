/**
 * Notification bell – topbar widget; shows unread count and opens dropdown.
 */

import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  NOTIFICATION_BELL_ADAPTER,
  NOTIFICATION_BELL_DROPDOWN,
} from '../notification-bell.adapter';
import { NotificationApiService } from '../services/notification-api.service';
import { NotificationBellCloseService } from '../services/notification-bell-close.service';
import { NotificationUnreadService } from '../services/notification-unread.service';
import { NotificationListComponent } from './notification-list.component';

@Component({
  selector: 'nf-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    NotificationListComponent,
    LucideAngularModule,
    RouterLink,
    TranslateModule,
  ],
  template: `
    <div class="nf-notification-bell">
      <button
        type="button"
        class="nf-notification-bell__btn"
        [attr.aria-label]="'notifications.bell.ariaLabel' | translate"
        (click)="toggleOpen()"
      >
        <lucide-icon name="bell" [size]="20" aria-hidden="true"></lucide-icon>
        @if (displayCount() > 0) {
          <span class="nf-notification-bell__badge">{{
            displayCount() > 99 ? '99+' : displayCount()
          }}</span>
        }
      </button>
      @if (open()) {
        <div class="nf-notification-bell__dropdown" (click)="$event.stopPropagation()">
          <div class="nf-notification-bell__dropdown-header">
            <span>{{ dropdownTitleKey() | translate }}</span>
            @if (showMarkAllRead()) {
              <button type="button" class="nf-notification-bell__mark-all" (click)="markAllRead()">
                {{ 'notifications.bell.markAllRead' | translate }}
              </button>
            }
          </div>
          @if (useErpDropdown()) {
            <ng-container *ngComponentOutlet="erpDropdownComponent!" />
          } @else {
            <nf-notification-list [compact]="true" (closed)="close()" />
          }
          <div class="nf-notification-bell__footer">
            <a routerLink="/notifications" (click)="close()">{{
              'notifications.bell.viewAll' | translate
            }}</a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
    .nf-notification-bell { position: relative; }
    .nf-notification-bell__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 34px;
      height: 34px;
      border: 1px solid transparent;
      border-radius: var(--nf-radius-lg, 0.5rem);
      background: transparent;
      cursor: pointer;
      color: var(--nf-text-secondary, #4b5563);
      transition: background var(--nf-transition-fast, 100ms ease);
    }
    .nf-notification-bell__btn:hover { background: var(--nf-surface-hover, #f3f4f6); }
    .nf-notification-bell__badge {
      position: absolute;
      top: 2px;
      inset-inline-end: 2px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      font-size: 0.7rem;
      line-height: 18px;
      text-align: center;
      border-radius: 9px;
      background: var(--nf-color-primary-600, #2563eb);
      color: #fff;
    }
    .nf-notification-bell__dropdown {
      position: absolute;
      top: 100%;
      inset-inline-end: 0;
      margin-top: 4px;
      min-width: 320px;
      max-width: 400px;
      max-height: 400px;
      overflow: auto;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 10px;
      background: var(--nf-surface-card, #fff);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    .nf-notification-bell__dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
      font-weight: 600;
    }
    .nf-notification-bell__mark-all {
      border: none;
      background: transparent;
      color: var(--nf-color-primary-600, #2563eb);
      cursor: pointer;
      font-size: 0.875rem;
    }
    .nf-notification-bell__footer {
      padding: 8px 12px;
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
      text-align: end;
    }
    .nf-notification-bell__footer a {
      color: var(--nf-color-primary-600, #2563eb);
      text-decoration: none;
      font-size: 0.875rem;
    }
  `],
})
export class NotificationBellComponent {
  private readonly api = inject(NotificationApiService);
  private readonly bellClose = inject(NotificationBellCloseService);
  private readonly adapter = inject(NOTIFICATION_BELL_ADAPTER, { optional: true });
  readonly erpDropdownComponent = inject(NOTIFICATION_BELL_DROPDOWN, { optional: true });
  readonly unreadCountStore = inject(NotificationUnreadService);

  readonly open = signal(false);

  readonly displayCount = computed(() =>
    this.adapter ? this.adapter.count() : this.unreadCountStore.count(),
  );

  readonly useErpDropdown = computed(
    () => this.adapter?.mode === 'erp-alerts' && this.erpDropdownComponent != null,
  );

  readonly dropdownTitleKey = computed(() =>
    this.useErpDropdown() ? 'shared.alerts.bellTitle' : 'notifications.bell.title',
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }
    const host = target.closest('.nf-notification-bell');
    if (!host) {
      this.close();
    }
  }

  toggleOpen(): void {
    this.open.update((v) => !v);
    if (this.open()) {
      this.bellClose.bind(() => this.close());
      void this.refresh();
    } else {
      this.bellClose.unbind();
    }
  }

  close(): void {
    this.open.set(false);
    this.bellClose.unbind();
  }

  showMarkAllRead(): boolean {
    if (this.useErpDropdown()) {
      return this.adapter?.supportsMarkAllRead ?? false;
    }
    return this.displayCount() > 0;
  }

  async refresh(): Promise<void> {
    if (this.adapter) {
      await this.adapter.refresh();
    }
    if (!this.useErpDropdown()) {
      await this.unreadCountStore.refresh();
    }
  }

  markAllRead(): void {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        void this.unreadCountStore.refresh();
      },
      error: () => {},
    });
  }
}
