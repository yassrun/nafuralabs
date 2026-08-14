import { Injectable, inject } from '@angular/core';

import type { NotificationBellAdapter } from '@platform/features/collaboration/notification/notification-bell.adapter';

import { ErpNotificationsService } from './erp-notifications.service';

@Injectable({ providedIn: 'root' })
export class ErpNotificationBellAdapter implements NotificationBellAdapter {
  private readonly erp = inject(ErpNotificationsService);

  readonly mode = 'erp-alerts' as const;
  readonly count = this.erp.totalCount;
  readonly supportsMarkAllRead = false;

  refresh(): Promise<void> {
    return this.erp.refresh();
  }
}
