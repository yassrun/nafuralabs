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
  PrintEntityType,
  PrintTemplate,
  PrintTemplateCreate,
  PrintTemplateUpdate,
  SampleRecord,
  TemplateVariable,
  TemplateVariableCatalogResponse,
  TemplateVariableDescriptor,
  TemplateVariableGroup,
} from '../models';

const BASE = '/api/v1/platform/templates';

/** Body of POST /templates/preview — an unsaved template rendered without persisting. */
export interface TemplatePreviewRequest {
  templateBody: string;
  entityType: string;
  paperSize?: string;
  orientation?: string;
  marginsCss?: string;
  /** When set, render with this record's real data instead of the sample. */
  sampleEntityId?: string;
}

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

  /**
   * Variable catalog for an entity type, flattened to a single list.
   * The backend groups descriptors by scope (entity / tenant / system); `group` is carried
   * over so the sidebar can section them.
   */
  async getVariables(entityType: string): Promise<TemplateVariable[]> {
    const res = await firstValueFrom(
      this.http.get<TemplateVariableCatalogResponse>(
        this.url(`${BASE}/variables/${encodeURIComponent(entityType)}`)
      )
    );
    const groups: TemplateVariableGroup[] = ['entity', 'tenant', 'system'];
    return groups.flatMap((group) => {
      const descriptors: TemplateVariableDescriptor[] = res?.[group] ?? [];
      return descriptors
        .filter((d) => !!d?.path)
        .map((d) => ({ path: d.path, label: d.label, type: d.type, example: d.example, group }));
    });
  }

  /**
   * Entity types that support templates (for filters and create).
   * No hardcoded fallback: an empty registry means no module declared a printable type,
   * and the UI must say so rather than offer types that resolve to nothing.
   */
  async getEntityTypes(): Promise<PrintEntityType[]> {
    const res = await firstValueFrom(
      this.http.get<{ entityTypes: PrintEntityType[] }>(this.url(`${BASE}/entity-types`))
    );
    return res?.entityTypes ?? [];
  }

  /**
   * Render an unsaved body. This is what makes the editor usable: the preview reflects what is
   * being typed, not the stored version.
   */
  async previewDraftHtml(request: TemplatePreviewRequest): Promise<string> {
    return firstValueFrom(
      this.http.post(this.url(`${BASE}/preview`), { ...request, format: 'html' }, {
        responseType: 'text',
      })
    );
  }

  /** Same draft, rendered to PDF. Never called automatically — it costs a full render. */
  async previewDraftPdf(request: TemplatePreviewRequest): Promise<Blob> {
    return firstValueFrom(
      this.http.post(this.url(`${BASE}/preview`), { ...request, format: 'pdf' }, {
        responseType: 'blob',
      })
    );
  }

  /** Real records for the "preview with" picker; empty when the module offers none. */
  async searchSampleRecords(entityType: string, q = ''): Promise<SampleRecord[]> {
    const params = new HttpParams().set('entityType', entityType).set('q', q);
    const res = await firstValueFrom(
      this.http.get<{ records: SampleRecord[] }>(this.url(`${BASE}/sample-records`), { params })
    );
    return res?.records ?? [];
  }
}
