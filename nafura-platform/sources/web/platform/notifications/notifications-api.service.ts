import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import { getEntityDetailRoute } from '../../features/approvals/config/entity-type-routes.config';
import { notificationSourceLabel } from './notification-source';
import {
  NotificationListQuery,
  NotificationPreferenceChoice,
  NotificationPreferenceSetting,
  PlatformNotificationDto,
  PlatformNotificationPage,
} from './notifications-api.types';
import { PlatformNotification, PlatformNotificationListResult } from './notifications.types';

const NOTIFICATIONS_PATH = '/api/v1/platform/collaboration/notifications';
const PREFERENCES_PATH = '/api/v1/platform/collaboration/notification-preferences';
const PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class PlatformNotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  list(query: NotificationListQuery = {}): Observable<PlatformNotificationListResult> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? PAGE_SIZE))
      .set('sort', 'sentAt,desc');
    if (query.view === 'unread') params = params.set('isRead', 'false');
    if (query.view === 'read') params = params.set('isRead', 'true');
    if (query.source) params = params.set('source', query.source);
    return this.http.get<PlatformNotificationPage>(this.url(NOTIFICATIONS_PATH), { params }).pipe(
      map((response) => ({
        items: (response.content ?? []).map((notification) => this.toModel(notification)),
        page: response.number ?? query.page ?? 0,
        totalElements: response.totalElements ?? response.content?.length ?? 0,
        last: response.last ?? true,
      })),
    );
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

  preferences(): Observable<readonly NotificationPreferenceSetting[]> {
    return this.http.get<NotificationPreferenceSetting[]>(this.url(PREFERENCES_PATH));
  }

  setPreference(choice: NotificationPreferenceChoice): Observable<readonly NotificationPreferenceSetting[]> {
    return this.http.put<NotificationPreferenceSetting[]>(this.url(PREFERENCES_PATH), choice);
  }

  organisationPreferences(): Observable<readonly NotificationPreferenceSetting[]> {
    return this.http.get<NotificationPreferenceSetting[]>(this.url(`${PREFERENCES_PATH}/organisation`));
  }

  setOrganisationPreference(
    choice: NotificationPreferenceChoice,
  ): Observable<readonly NotificationPreferenceSetting[]> {
    return this.http.put<NotificationPreferenceSetting[]>(this.url(`${PREFERENCES_PATH}/organisation`), choice);
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
      entityType: notification.entityType,
      entityId: notification.entityId,
      actionUrl: notification.actionUrl,
      source: notification.source,
      sourceLabel: notificationSourceLabel(notification.source),
      route: resolveNotificationRoute(notification),
    };
  }
}

/** Prefer the explicit link; otherwise resolve the record route declared by business contexts. */
export function resolveNotificationRoute(notification: PlatformNotificationDto): string | undefined {
  if (notification.actionUrl) {
    return notification.actionUrl;
  }
  if (!notification.entityType || !notification.entityId) {
    return undefined;
  }
  const parts = getEntityDetailRoute(notification.entityType, notification.entityId);
  if (!parts.length) {
    return undefined;
  }
  return parts.length === 1 ? parts[0] : parts.join('/');
}
