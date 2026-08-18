import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  channel: string;
  entityType: string | null;
  entityId: string | null;
  source: string | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  sentAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

export interface NotificationFilters {
  source?: string | null;
  status?: 'all' | 'read' | 'unread';
  dateRange?: '24h' | '7d' | '30d' | 'all';
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private resolveUrl(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async list(
    filters: NotificationFilters,
    page = 0,
    size = 20
  ): Promise<PageResponse<NotificationItem>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (filters.source && filters.source !== 'all') {
      params = params.set('source', filters.source);
    }
    if (filters.status === 'read') {
      params = params.set('isRead', 'true');
    } else if (filters.status === 'unread') {
      params = params.set('isRead', 'false');
    }

    const now = new Date();
    if (filters.dateRange && filters.dateRange !== 'all') {
      const from = new Date(now);
      if (filters.dateRange === '24h') {
        from.setHours(from.getHours() - 24);
      } else if (filters.dateRange === '7d') {
        from.setDate(from.getDate() - 7);
      } else if (filters.dateRange === '30d') {
        from.setDate(from.getDate() - 30);
      }
      params = params.set('from', from.toISOString()).set('to', now.toISOString());
    }

    return firstValueFrom(
      this.http.get<PageResponse<NotificationItem>>(
        this.resolveUrl('/api/v1/platform/collaboration/notifications'),
        { params }
      )
    );
  }

  async unreadCount(): Promise<number> {
    const response = await firstValueFrom(
      this.http.get<{ count: number }>(
        this.resolveUrl('/api/v1/platform/collaboration/notifications/unread-count')
      )
    );
    return response.count;
  }

  async markRead(id: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        this.resolveUrl(
          `/api/v1/platform/collaboration/notifications/${encodeURIComponent(id)}/read`
        ),
        {}
      )
    );
  }

  async markAllRead(): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        this.resolveUrl('/api/v1/platform/collaboration/notifications/read-all'),
        {}
      )
    );
  }

  async bulkMarkRead(ids: string[]): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        this.resolveUrl('/api/v1/platform/collaboration/notifications/bulk-read'),
        { ids }
      )
    );
  }

  async deleteReadBefore(beforeIso: string): Promise<number> {
    const params = new HttpParams().set('before', beforeIso);
    const response = await firstValueFrom(
      this.http.delete<{ deleted: number }>(
        this.resolveUrl('/api/v1/platform/collaboration/notifications/read-before'),
        { params }
      )
    );
    return response.deleted;
  }
}
