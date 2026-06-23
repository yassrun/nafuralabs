/**
 * Print Template API Service
 *
 * Lists document templates and renders them to PDF for entity records.
 * Base path: /api/v1/platform/templates
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from '../../../core/config/api-config.service';

const BASE = '/api/v1/platform/templates';

export interface DocumentTemplateDto {
  id: string;
  name: string;
  code?: string;
  entityType: string;
  system?: boolean;
  description?: string;
}

export interface RenderTemplateRequest {
  entityType: string;
  entityId: string;
}

@Injectable({ providedIn: 'root' })
export class PrintTemplateApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.getApiBaseUrl();
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base.replace(/\/$/, '')}${p}`;
  }

  /**
   * List templates filtered by entity type.
   * GET /api/v1/platform/templates?entityType=invoice
   */
  listByEntityType(entityType: string): Promise<DocumentTemplateDto[]> {
    const params = new HttpParams().set('entityType', entityType);
    return firstValueFrom(
      this.http.get<DocumentTemplateDto[]>(this.url(BASE), { params })
    );
  }

  /**
   * Render template with entity data to PDF.
   * POST /api/v1/platform/templates/{id}/render
   * Body: { entityType, entityId }
   * Response: application/pdf binary
   */
  renderPdf(
    templateId: string,
    request: RenderTemplateRequest
  ): Promise<{ blob: Blob; contentDisposition?: string }> {
    const url = `${this.url(BASE)}/${encodeURIComponent(templateId)}/render`;
    return firstValueFrom(
      this.http.post(url, request, {
        responseType: 'blob',
        observe: 'response',
      })
    ).then((res) => ({
      blob: res.body!,
      contentDisposition: res.headers.get('Content-Disposition') ?? undefined,
    }));
  }
}
