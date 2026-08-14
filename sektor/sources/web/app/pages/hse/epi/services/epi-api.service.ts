import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';

import { type ApiEpiDotation, epiToUi } from './epi.mapper';
import type { EpiRecord } from '../epi.models';

interface EpiQuery extends ListQuery {
  employeId?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class EpiApiService extends FeatureApiService<EpiRecord> {
  protected override basePath = '/api/v1/hse/epi-dotations';
  protected override searchFields = ['reference', 'designation', 'employeNom', 'chantierCode'];

  override async getAll(query?: ListQuery): Promise<ListResponse<EpiRecord>> {
    const q = (query ?? {}) as EpiQuery;
    const params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
      employeId: q.employeId,
    });
    const rows = await this.get<ApiEpiDotation[]>(this.basePath, params);
    const items = (rows ?? []).map(epiToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<EpiRecord> {
    const row = await this.get<ApiEpiDotation>(`${this.basePath}/${id}`);
    return epiToUi(row);
  }

  async listExpirant(days = 30, employeId?: string): Promise<EpiRecord[]> {
    const params = this.buildQueryParams({
      page: 0,
      pageSize: 500,
      days,
      employeId,
    });
    const rows = await this.get<ApiEpiDotation[]>(`${this.basePath}/expirant`, params);
    return (rows ?? []).map(epiToUi);
  }
}
