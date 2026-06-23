/**
 * Platform Comment API – polymorphic entityType + entityId, threaded replies.
 * Base path: /api/v1/platform/collaboration/comments
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../../core/config/api-config.service';

const BASE = '/api/v1/platform/collaboration/comments';

export interface RecordCommentDto {
  id: string;
  entityType: string;
  entityId: string;
  author: string;
  body: string;
  parentId?: string;
  createdAt: string;
  editedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class CommentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  listComments(entityType: string, entityId: string, page = 0, size = 50): Observable<PageResponse<RecordCommentDto>> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<RecordCommentDto>>(this.url(BASE), { params });
  }

  listReplies(parentId: string): Observable<RecordCommentDto[]> {
    return this.http.get<RecordCommentDto[]>(this.url(`${BASE}/${parentId}/replies`));
  }

  addComment(entityType: string, entityId: string, text: string): Observable<RecordCommentDto> {
    return this.http.post<RecordCommentDto>(this.url(BASE), { entityType, entityId, text });
  }

  addReply(entityType: string, entityId: string, parentCommentId: string, text: string): Observable<RecordCommentDto> {
    return this.http.post<RecordCommentDto>(this.url(`${BASE}/reply`), {
      entityType,
      entityId,
      parentCommentId,
      text,
    });
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`${BASE}/${id}`));
  }
}
