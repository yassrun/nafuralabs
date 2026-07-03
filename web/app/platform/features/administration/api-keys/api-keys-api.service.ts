import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

export interface ApiKeyItem {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  createdBy: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyPayload {
  name: string;
  permissions: string[];
  expiresAt: string | null;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKeyItem;
  plainKey: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ApiKeysApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private resolveUrl(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async list(page = 0, size = 50): Promise<PageResponse<ApiKeyItem>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return firstValueFrom(
      this.http.get<PageResponse<ApiKeyItem>>(
        this.resolveUrl('/api/v1/platform/admin/api-keys'),
        { params }
      )
    );
  }

  async create(payload: CreateApiKeyPayload): Promise<CreateApiKeyResponse> {
    return firstValueFrom(
      this.http.post<CreateApiKeyResponse>(
        this.resolveUrl('/api/v1/platform/admin/api-keys'),
        payload
      )
    );
  }

  async revoke(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(
        this.resolveUrl(`/api/v1/platform/admin/api-keys/${encodeURIComponent(id)}`)
      )
    );
  }
}
