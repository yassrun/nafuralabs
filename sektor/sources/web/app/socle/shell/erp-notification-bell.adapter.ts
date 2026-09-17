import { Injectable, computed, inject } from '@angular/core';

import type { NotificationBellAdapter } from '@platform/app/notification/notification-bell.adapter';
import { NotificationStreamService } from '@platform/app/notification/services/notification-stream.service';
import { NotificationUnreadService } from '@platform/app/notification/services/notification-unread.service';

import { ErpNotificationsService } from './erp-notifications.service';

@Injectable({ providedIn: 'root' })
export class ErpNotificationBellAdapter implements NotificationBellAdapter {
  private readonly erp = inject(ErpNotificationsService);
  private readonly unread = inject(NotificationUnreadService);
  private readonly stream = inject(NotificationStreamService);
  private liveStarted = false;

  readonly mode = 'merged' as const;
  readonly count = computed(() => this.erp.totalCount() + this.unread.count());
  readonly supportsMarkAllRead = true;

  async refresh(): Promise<void> {
    this.ensureLive();
    await Promise.all([this.erp.refresh(), this.unread.refresh()]);
  }

  /** Idempotent SSE + polling (auto-login and identity picker). */
  private ensureLive(): void {
    if (this.liveStarted) {
      return;
    }
    this.liveStarted = true;
    this.stream.subscribe((event) => {
      if (event.type === 'refresh') {
        void this.erp.refresh();
        void this.unread.refresh();
      } else if (event.type === 'new_notification') {
        void this.unread.refresh();
      }
    });
    this.stream.connect();
    this.erp.startPolling();
  }
}
