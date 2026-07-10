import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

export interface NumberingSequenceItem {
  id: string;
  code: string;
  name: string;
  prefix: string | null;
  separator: string | null;
  yearFormat: string | null;
  resetPolicy: string | null;
  currentNumber: number;
  incrementBy: number;
  padLength: number;
  lastResetAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NumberingSequencePayload {
  code: string;
  name: string;
  prefix: string | null;
  separator: string | null;
  yearFormat: string | null;
  resetPolicy: string | null;
  currentNumber: number;
  incrementBy: number;
  padLength: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class NumberingSequencesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private resolveUrl(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async list(page = 0, size = 100): Promise<PageResponse<NumberingSequenceItem>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'name,asc');
    return firstValueFrom(
      this.http.get<PageResponse<NumberingSequenceItem>>(
        this.resolveUrl('/api/v1/numbering-sequences'),
        { params }
      )
    );
  }

  async create(payload: NumberingSequencePayload): Promise<NumberingSequenceItem> {
    return firstValueFrom(
      this.http.post<NumberingSequenceItem>(this.resolveUrl('/api/v1/numbering-sequences'), payload)
    );
  }

  async update(id: string, payload: NumberingSequencePayload): Promise<NumberingSequenceItem> {
    return firstValueFrom(
      this.http.put<NumberingSequenceItem>(
        this.resolveUrl(`/api/v1/numbering-sequences/${encodeURIComponent(id)}`),
        payload
      )
    );
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(
        this.resolveUrl(`/api/v1/numbering-sequences/${encodeURIComponent(id)}`)
      )
    );
  }

  async preview(payload: {
    prefix: string;
    separator: string | null;
    yearFormat: string | null;
    padLength: number;
    currentNumber: number;
  }): Promise<string> {
    let params = new HttpParams()
      .set('prefix', payload.prefix ?? '')
      .set('padLength', String(payload.padLength))
      .set('currentNumber', String(payload.currentNumber));
    if (payload.separator) {
      params = params.set('separator', payload.separator);
    }
    if (payload.yearFormat) {
      params = params.set('yearFormat', payload.yearFormat);
    }
    const response = await firstValueFrom(
      this.http.get<{ preview: string }>(
        this.resolveUrl('/api/v1/numbering-sequences/preview'),
        { params }
      )
    );
    return response.preview;
  }

  async generate(id: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ number: string }>(
        this.resolveUrl(`/api/v1/numbering-sequences/${encodeURIComponent(id)}/generate`),
        null
      )
    );
    return response.number;
  }
}
