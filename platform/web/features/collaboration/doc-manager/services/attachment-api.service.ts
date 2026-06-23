/**
 * Platform Attachment API – polymorphic entityType + entityId.
 * Base path: /api/v1/platform/collaboration/attachments
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../../core/config/api-config.service';

const BASE = '/api/v1/platform/collaboration/attachments';

export interface RecordAttachmentDto {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class AttachmentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  listAttachments(entityType: string, entityId: string, page = 0, size = 50): Observable<PageResponse<RecordAttachmentDto>> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<RecordAttachmentDto>>(this.url(BASE), { params });
  }

  uploadAttachment(entityType: string, entityId: string, file: File): Observable<RecordAttachmentDto> {
    const form = new FormData();
    form.append('entityType', entityType);
    form.append('entityId', entityId);
    form.append('file', file);
    return this.http.post<RecordAttachmentDto>(this.url(`${BASE}/upload`), form);
  }

  deleteAttachment(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`${BASE}/${id}`));
  }

  getAttachmentDownloadUrl(key: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${BASE}/download?key=${encodeURIComponent(key)}`;
  }
}
