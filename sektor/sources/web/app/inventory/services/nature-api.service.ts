import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

import type { Nature } from '../models';

export interface NatureDto {
  code: Nature;
  libelle: string;
  stockable: boolean;
  valorise: boolean;
  uomDefaut: string | null;
  posteBudgetDefaut: string;
  typeDpu: string;
}

/**
 * Référentiel natures d'article — lecture seule (`GET /api/v1/article-natures`).
 */
@Injectable({ providedIn: 'root' })
export class NatureApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private cache: NatureDto[] | null = null;

  async list(force = false): Promise<NatureDto[]> {
    if (this.cache && !force) {
      return this.cache;
    }
    const url = `${this.apiConfig.getApiBaseUrl().replace(/\/$/, '')}/api/v1/article-natures`;
    this.cache = await firstValueFrom(this.http.get<NatureDto[]>(url));
    return this.cache ?? [];
  }

  async byCode(code: string): Promise<NatureDto | undefined> {
    const all = await this.list();
    return all.find((n) => n.code === code);
  }
}
