import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import {
  PlatformNotificationDto,
  PlatformNotificationPage,
} from './notifications-api.types';
import { PlatformNotification } from './notifications.types';

const NOTIFICATIONS_PATH = '/api/v1/platform/collaboration/notifications';

@Injectable({ providedIn: 'root' })
export class PlatformNotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  list(page = 0, size = 20): Observable<readonly PlatformNotification[]> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http
      .get<PlatformNotificationPage>(this.url(NOTIFICATIONS_PATH), { params })
      .pipe(map((response) => response.content.map((notification) => this.toModel(notification))));
  }

  unreadCount(): Observable<number> {
    return this.http
      .get<{ count: number }>(this.url(`${NOTIFICATIONS_PATH}/unread-count`))
      .pipe(map((response) => response.count));
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(this.url(`${NOTIFICATIONS_PATH}/${id}/read`), {});
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(this.url(`${NOTIFICATIONS_PATH}/read-all`), {});
  }

  private url(path: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${path}`;
  }

  private toModel(notification: PlatformNotificationDto): PlatformNotification {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.body,
      read: notification.isRead ?? false,
      createdAt: notification.sentAt,
      route: notification.actionUrl,
    };
  }
}
