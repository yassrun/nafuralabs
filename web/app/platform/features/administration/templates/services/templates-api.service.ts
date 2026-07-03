/**
 * Print templates API – list, CRUD, preview, variables.
 * Base path: /api/v1/platform/templates
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import { ApiConfigService } from '../../../../core/config/api-config.service';
import type {
  PrintTemplate,
  PrintTemplateCreate,
  PrintTemplateUpdate,
  TemplateVariablesResponse,
} from '../models';

const BASE = '/api/v1/platform/templates';

@Injectable({ providedIn: 'root' })
export class TemplatesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  async getList(query?: ListQuery): Promise<ListResponse<PrintTemplate>> {
    let params = new HttpParams();
    if (query) {
      const page = Math.max(0, Number(query.page ?? 1) - 1);
      const size = Number(query.pageSize ?? 20);
      params = params.set('page', String(page)).set('size', String(size));
      if (query['sortBy']) params = params.set('sort', String(query['sortBy']));
      if (query['sortDirection']) params = params.set('direction', String(query['sortDirection']));
      if (query['entityType']) params = params.set('entityType', String(query['entityType']));
      const qType = query['type'];
      if (qType === 'system' || qType === 'custom') {
        params = params.set('system', qType === 'system' ? 'true' : 'false');
      }
      if (query['search']) params = params.set('search', String(query['search']));
    }
    const res = await firstValueFrom(
      this.http.get<{ content: PrintTemplate[]; totalElements: number }>(this.url(BASE), {
        params,
      })
    );
    return {
      items: res.content ?? [],
      total: res.totalElements ?? 0,
    };
  }

  async getById(id: string): Promise<PrintTemplate> {
    return firstValueFrom(this.http.get<PrintTemplate>(this.url(`${BASE}/${id}`)));
  }

  async create(body: PrintTemplateCreate): Promise<PrintTemplate> {
    return firstValueFrom(this.http.post<PrintTemplate>(this.url(BASE), body));
  }

  async update(id: string, body: PrintTemplateUpdate): Promise<PrintTemplate> {
    return firstValueFrom(this.http.put<PrintTemplate>(this.url(`${BASE}/${id}`), body));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(this.url(`${BASE}/${id}`)));
  }

  /**
   * Preview URL: GET returns PDF blob. Call with current template body if backend supports draft preview.
   */
  getPreviewUrl(id: string, _draftBody?: string): string {
    return this.url(`${BASE}/${id}/preview`);
  }

  /**
   * Load preview as blob (for iframe or download).
   */
  async getPreviewBlob(id: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get(this.url(`${BASE}/${id}/preview`), { responseType: 'blob' })
    );
  }

  async getVariables(entityType: string): Promise<TemplateVariablesResponse> {
    return firstValueFrom(
      this.http.get<TemplateVariablesResponse>(this.url(`${BASE}/variables/${encodeURIComponent(entityType)}`))
    );
  }

  /** Entity types that support templates (for filters and create). */
  async getEntityTypes(): Promise<string[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ entityTypes: string[] }>(this.url(`${BASE}/entity-types`))
      );
      return res?.entityTypes ?? [];
    } catch {
      return ['Invoice', 'Quote', 'Receipt', 'Order'];
    }
  }
}
