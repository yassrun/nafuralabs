/**
 * Email templates API – list, CRUD, preview.
 * Base path: /api/v1/platform/email-templates
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import { ApiConfigService } from '../../../../core/config/api-config.service';
import type {
  EmailTemplate,
  EmailTemplateCreate,
  EmailTemplateUpdate,
  EmailTemplatePreviewResponse,
} from '../models';

const BASE = '/api/v1/platform/email-templates';

@Injectable({ providedIn: 'root' })
export class EmailTemplatesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  async getList(query?: ListQuery): Promise<ListResponse<EmailTemplate>> {
    let params = new HttpParams();
    if (query) {
      const page = Math.max(0, Number(query.page ?? 1) - 1);
      const size = Number(query.pageSize ?? 20);
      params = params.set('page', String(page)).set('size', String(size));
      const sortBy = query['sortBy'];
      const sortDir = query['sortDirection'];
      if (sortBy) {
        params = params.set('sort', sortDir ? `${sortBy},${sortDir}` : String(sortBy));
      }
      const qType = query['type'];
      if (qType === 'system' || qType === 'custom') {
        params = params.set('system', qType === 'system' ? 'true' : 'false');
      }
      if (query['entityType']) params = params.set('entityType', String(query['entityType']));
    }
    const res = await firstValueFrom(
      this.http.get<{ content: EmailTemplate[]; totalElements: number }>(this.url(BASE), {
        params,
      })
    );
    return {
      items: res.content ?? [],
      total: res.totalElements ?? 0,
    };
  }

  async getById(id: string): Promise<EmailTemplate> {
    return firstValueFrom(this.http.get<EmailTemplate>(this.url(`${BASE}/${id}`)));
  }

  async create(body: EmailTemplateCreate): Promise<EmailTemplate> {
    return firstValueFrom(this.http.post<EmailTemplate>(this.url(BASE), body));
  }

  async update(id: string, body: EmailTemplateUpdate): Promise<EmailTemplate> {
    return firstValueFrom(this.http.put<EmailTemplate>(this.url(`${BASE}/${id}`), body));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(this.url(`${BASE}/${id}`)));
  }

  async preview(id: string, variables?: Record<string, unknown>): Promise<EmailTemplatePreviewResponse> {
    return firstValueFrom(
      this.http.post<EmailTemplatePreviewResponse>(
        this.url(`${BASE}/${id}/preview`),
        variables ?? {}
      )
    );
  }
}
