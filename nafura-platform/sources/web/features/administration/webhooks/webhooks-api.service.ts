import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

export interface WebhookConfigItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastDeliveryStatus: string | null;
}

export interface WebhookDeliveryItem {
  id: string;
  webhookId: string;
  event: string;
  status: string;
  attempts: number;
  responseCode: number | null;
  errorMessage: string | null;
  payload: string;
  responseBody: string | null;
  createdAt: string;
  lastAttemptAt: string | null;
}

export interface WebhookUpsertPayload {
  name: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class WebhooksApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private resolveUrl(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }

  async list(page = 0, size = 20): Promise<PageResponse<WebhookConfigItem>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return firstValueFrom(
      this.http.get<PageResponse<WebhookConfigItem>>(
        this.resolveUrl('/api/v1/platform/admin/webhooks'),
        { params }
      )
    );
  }

  async create(payload: WebhookUpsertPayload): Promise<WebhookConfigItem> {
    return firstValueFrom(
      this.http.post<WebhookConfigItem>(
        this.resolveUrl('/api/v1/platform/admin/webhooks'),
        payload
      )
    );
  }

  async update(id: string, payload: WebhookUpsertPayload): Promise<WebhookConfigItem> {
    return firstValueFrom(
      this.http.put<WebhookConfigItem>(
        this.resolveUrl(`/api/v1/platform/admin/webhooks/${encodeURIComponent(id)}`),
        payload
      )
    );
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(
        this.resolveUrl(`/api/v1/platform/admin/webhooks/${encodeURIComponent(id)}`)
      )
    );
  }

  async deliveries(webhookId: string, page = 0, size = 20): Promise<PageResponse<WebhookDeliveryItem>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return firstValueFrom(
      this.http.get<PageResponse<WebhookDeliveryItem>>(
        this.resolveUrl(
          `/api/v1/platform/admin/webhooks/${encodeURIComponent(webhookId)}/deliveries`
        ),
        { params }
      )
    );
  }

  async test(webhookId: string): Promise<{ success: boolean; responseCode: number | null }> {
    return firstValueFrom(
      this.http.post<{ success: boolean; responseCode: number | null }>(
        this.resolveUrl(`/api/v1/platform/admin/webhooks/${encodeURIComponent(webhookId)}/test`),
        {}
      )
    );
  }
}
