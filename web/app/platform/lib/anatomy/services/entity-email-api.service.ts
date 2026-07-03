/**
 * Entity Email API Service
 *
 * Lists email templates by entity type, previews rendered content, and sends entity emails.
 * Base paths: /api/v1/platform/email-templates, /api/v1/platform/email
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from '../../../core/config/api-config.service';

const EMAIL_TEMPLATES_BASE = '/api/v1/platform/email-templates';
const EMAIL_BASE = '/api/v1/platform/email';

export interface EmailTemplateDto {
  id: string;
  code: string;
  name: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  entityType?: string;
  isSystem?: boolean;
}

export interface EmailPreviewRequest {
  emailTemplateId: string;
  entityType: string;
  entityId: string;
}

export interface EmailPreviewResponse {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface SendEntityEmailRequest {
  to: string[];
  cc?: string[];
  emailTemplateId: string;
  entityType: string;
  entityId: string;
  attachPdf: boolean;
  printTemplateId?: string;
}

@Injectable({ providedIn: 'root' })
export class EntityEmailApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.getApiBaseUrl();
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base.replace(/\/$/, '')}${p}`;
  }

  /**
   * List email templates for the given entity type.
   * GET /api/v1/platform/email-templates?entityType=invoice&size=100
   */
  listTemplatesByEntityType(entityType: string): Promise<EmailTemplateDto[]> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('size', '100');
    return firstValueFrom(
      this.http.get<{ content: EmailTemplateDto[] }>(this.url(EMAIL_TEMPLATES_BASE), {
        params,
      })
    ).then((page) => page.content ?? []);
  }

  /**
   * Preview rendered subject and body for template + entity.
   * POST /api/v1/platform/email/preview
   */
  preview(request: EmailPreviewRequest): Promise<EmailPreviewResponse> {
    return firstValueFrom(
      this.http.post<EmailPreviewResponse>(this.url(`${EMAIL_BASE}/preview`), request)
    );
  }

  /**
   * Send entity email (optionally with PDF attachment).
   * POST /api/v1/platform/email/send
   */
  send(request: SendEntityEmailRequest): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(this.url(`${EMAIL_BASE}/send`), request, {
        observe: 'response',
      })
    ).then((res) => undefined);
  }
}
