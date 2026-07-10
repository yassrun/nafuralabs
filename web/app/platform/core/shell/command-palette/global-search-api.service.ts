import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

import type { SearchResult } from './command-palette.types';

interface GlobalSearchResultDto {
  id: string;
  entityType: string;
  title: string;
  subtitle: string | null;
  route: string;
  icon: string | null;
  score: number;
}

interface GlobalSearchResponseDto {
  results: GlobalSearchResultDto[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private resolveUrl(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async search(query: string, size = 10): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }

    const params = new HttpParams()
      .set('q', trimmed)
      .set('size', String(size));
    const response = await firstValueFrom(
      this.http.get<GlobalSearchResponseDto>(
        this.resolveUrl('/api/v1/platform/search'),
        { params }
      )
    );

    return (response.results ?? []).map((item) => ({
      id: `${item.entityType}:${item.id}`,
      label: item.title,
      icon: item.icon || 'file',
      route: item.route,
      subtitle: item.subtitle ?? '',
      category: 'records',
      score: item.score,
    }));
  }
}
