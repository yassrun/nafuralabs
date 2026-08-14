/**
 * Platform Audit API – timeline and log.
 * Base path: /api/v1/platform/collaboration/audit
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../../core/config/api-config.service';

const BASE = '/api/v1/platform/collaboration/audit';

export interface AuditEventDto {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  eventAt: string;
  details?: string;
  payload?: Record<string, unknown>;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages?: number;
  size: number;
  number: number;
}

export interface AuditLogQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  search?: string;
  entityType?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  getAuditTimeline(
    entityType: string,
    entityId: string,
    page = 0,
    size = 20,
    action?: string
  ): Observable<PageResponse<AuditEventDto>> {
    let params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId)
      .set('page', String(page))
      .set('size', String(size));
    if (action) {
      params = params.set('action', action);
    }
    return this.http.get<PageResponse<AuditEventDto>>(this.url(`${BASE}/timeline`), { params });
  }

  logAudit(entityType: string, entityId: string, action: string, details?: string, payload?: Record<string, unknown>): Observable<AuditEventDto> {
    return this.http.post<AuditEventDto>(this.url(`${BASE}/log`), {
      entityType,
      entityId,
      action,
      details,
      payload,
    });
  }

  getEntityTypes(): Observable<string[]> {
    return this.http.get<string[]>(this.url(`${BASE}/log/entity-types`));
  }

  getAuditLog(params: AuditLogQueryParams): Observable<PageResponse<AuditEventDto>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', String(params.size));
    }
    if (params.sort) {
      const sortParam = params.direction ? `${params.sort},${params.direction}` : params.sort;
      httpParams = httpParams.set('sort', sortParam);
    }
    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }
    if (params.entityType?.trim()) {
      httpParams = httpParams.set('entityType', params.entityType.trim());
    }
    if (params.action?.trim()) {
      httpParams = httpParams.set('action', params.action.trim());
    }
    if (params.actor?.trim()) {
      httpParams = httpParams.set('actor', params.actor.trim());
    }
    if (params.from) {
      httpParams = httpParams.set('from', params.from);
    }
    if (params.to) {
      httpParams = httpParams.set('to', params.to);
    }
    return this.http.get<PageResponse<AuditEventDto>>(this.url(`${BASE}/log`), { params: httpParams });
  }
}
