/**
 * Document customisation API.
 * Base path: /api/v1/platform/document-settings
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from '../../../../core/config/api-config.service';
import type { DocumentSettings } from '../models/document-settings.model';

const BASE = '/api/v1/platform/document-settings';

@Injectable({ providedIn: 'root' })
export class DocumentSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path = ''): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    return `${base}${BASE}${path}`;
  }

  private scope(entityType?: string): HttpParams {
    let params = new HttpParams();
    if (entityType) params = params.set('entityType', entityType);
    return params;
  }

  async get(entityType?: string): Promise<DocumentSettings> {
    return firstValueFrom(
      this.http.get<DocumentSettings>(this.url(), { params: this.scope(entityType) })
    );
  }

  async save(settings: DocumentSettings, entityType?: string): Promise<DocumentSettings> {
    return firstValueFrom(
      this.http.put<DocumentSettings>(this.url(), settings, { params: this.scope(entityType) })
    );
  }

  async reset(entityType?: string): Promise<DocumentSettings> {
    return firstValueFrom(
      this.http.post<DocumentSettings>(this.url('/reset'), {}, { params: this.scope(entityType) })
    );
  }

  /**
   * Renders the default template of a type with the settings being edited, unsaved.
   * Returns an empty string when the type has no template yet.
   */
  async preview(settings: DocumentSettings, entityType: string): Promise<string> {
    return firstValueFrom(
      this.http.post(this.url('/preview'), settings, {
        params: new HttpParams().set('entityType', entityType),
        responseType: 'text',
      })
    );
  }

  /** Values an administrator may insert into free text. */
  async getTokens(): Promise<string[]> {
    const res = await firstValueFrom(
      this.http.get<{ tokens: string[] }>(this.url('/tokens'))
    );
    return res?.tokens ?? [];
  }
}
