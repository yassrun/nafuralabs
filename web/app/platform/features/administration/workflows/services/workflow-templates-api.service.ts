/**
 * Workflow templates API – list, CRUD, entity types.
 * Base path: /api/v1/platform/collaboration/workflow/templates
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import { ApiConfigService } from '../../../../core/config/api-config.service';
import type {
  WorkflowTemplate,
  WorkflowTemplateCreate,
  WorkflowTemplateUpdate,
} from '../models';

const BASE = '/api/v1/platform/collaboration/workflow/templates';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class WorkflowTemplatesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  async getList(query?: ListQuery): Promise<ListResponse<WorkflowTemplate>> {
    let params = new HttpParams();
    if (query) {
      const page = Math.max(0, Number(query.page ?? 1) - 1);
      const size = Number(query.pageSize ?? 20);
      params = params.set('page', String(page)).set('size', String(size));
      if (query['sortBy']) {
        const dir = query['sortDirection'] === 'desc' ? 'desc' : 'asc';
        params = params.set('sort', `${String(query['sortBy'])},${dir}`);
      }
      if (query['entityType']) params = params.set('entityType', String(query['entityType']));
      if (query['search']) params = params.set('search', String(query['search']));
    }
    const res = await firstValueFrom(
      this.http.get<PageResponse<WorkflowTemplate>>(this.url(BASE), { params })
    );
    return {
      items: res.content ?? [],
      total: res.totalElements ?? 0,
    };
  }

  async getById(id: string): Promise<WorkflowTemplate> {
    return firstValueFrom(this.http.get<WorkflowTemplate>(this.url(`${BASE}/${id}`)));
  }

  async create(body: WorkflowTemplateCreate): Promise<WorkflowTemplate> {
    return firstValueFrom(this.http.post<WorkflowTemplate>(this.url(BASE), body));
  }

  async update(id: string, body: WorkflowTemplateUpdate): Promise<WorkflowTemplate> {
    return firstValueFrom(this.http.put<WorkflowTemplate>(this.url(`${BASE}/${id}`), body));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(this.url(`${BASE}/${id}`)));
  }

  async setActive(id: string, active: boolean): Promise<WorkflowTemplate> {
    return firstValueFrom(
      this.http.patch<WorkflowTemplate>(this.url(`${BASE}/${id}/active`), null, {
        params: new HttpParams().set('active', String(active)),
      })
    );
  }

  async getEntityTypes(): Promise<string[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ entityTypes: string[] }>(this.url(`${BASE}/entity-types`))
      );
      return res?.entityTypes ?? [];
    } catch {
      return ['Invoice', 'Quote', 'Receipt', 'Order', 'PurchaseOrder', 'Contract', 'Document'];
    }
  }
}
