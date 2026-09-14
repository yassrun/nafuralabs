import { Injectable, computed, inject } from '@angular/core';

import type { NotificationBellAdapter } from '@platform/app/notification/notification-bell.adapter';
import { NotificationUnreadService } from '@platform/app/notification/services/notification-unread.service';

import { ErpNotificationsService } from './erp-notifications.service';

@Injectable({ providedIn: 'root' })
export class ErpNotificationBellAdapter implements NotificationBellAdapter {
  private readonly erp = inject(ErpNotificationsService);
  private readonly unread = inject(NotificationUnreadService);

  readonly mode = 'merged' as const;
  readonly count = computed(() => this.erp.totalCount() + this.unread.count());
  readonly supportsMarkAllRead = true;

  async refresh(): Promise<void> {
    await Promise.all([this.erp.refresh(), this.unread.refresh()]);
  }
}
