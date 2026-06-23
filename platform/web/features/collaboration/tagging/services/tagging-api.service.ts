/**
 * Platform Tagging API – tags and entity tags.
 * Base path: /api/v1/platform/collaboration/tags
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../../core/config/api-config.service';

const BASE = '/api/v1/platform/collaboration/tags';

export interface TagDto {
  id: string;
  name: string;
  color?: string;
  category?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class TaggingApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  listTags(page = 0, size = 50): Observable<PageResponse<TagDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponse<TagDto>>(this.url(BASE), { params });
  }

  createTag(name: string, color?: string, category?: string): Observable<TagDto> {
    return this.http.post<TagDto>(this.url(BASE), { name, color, category });
  }

  deleteTag(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`${BASE}/${id}`));
  }

  tagEntity(entityType: string, entityId: string, tagId: string): Observable<void> {
    return this.http.post<void>(this.url(`${BASE}/entities/${entityType}/${entityId}`), { tagId });
  }

  untagEntity(entityType: string, entityId: string, tagId: string): Observable<void> {
    return this.http.delete<void>(this.url(`${BASE}/entities/${entityType}/${entityId}/${tagId}`));
  }

  listEntityTags(entityType: string, entityId: string): Observable<TagDto[]> {
    return this.http.get<TagDto[]>(this.url(`${BASE}/entities/${entityType}/${entityId}`));
  }
}
