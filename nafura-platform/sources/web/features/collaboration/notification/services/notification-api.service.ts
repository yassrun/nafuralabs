/**
 * Platform Notification API – in-app notifications.
 * Base path: /api/v1/platform/collaboration/notifications
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiConfigService } from '../../../../core/config/api-config.service';

const BASE = '/api/v1/platform/collaboration/notifications';

export interface NotificationDto {
  id: string;
  title: string;
  body?: string;
  channel: string;
  entityType?: string;
  entityId?: string;
  isRead?: boolean;
  readAt?: string;
  sentAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  listNotifications(page = 0, size = 20): Observable<PageResponse<NotificationDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponse<NotificationDto>>(this.url(BASE), { params });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(this.url(`${BASE}/unread-count`)).pipe(
      map((r) => r.count)
    );
  }

  markNotificationRead(id: string): Observable<void> {
    return this.http.post<void>(this.url(`${BASE}/${id}/read`), {});
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.post<void>(this.url(`${BASE}/read-all`), {});
  }
}
