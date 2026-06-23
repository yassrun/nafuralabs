import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { PhsDocument } from '../../models';

import { type ApiPhs, phsToUi } from './phs.mapper';

@Injectable({ providedIn: 'root' })
export class PhsApiService extends FeatureApiService<PhsDocument, unknown, unknown> {
  protected override basePath = '/api/v1/hse/phs';
  protected override searchFields = ['numero', 'auteurNom', 'titre'];

  override async getAll(_query?: ListQuery): Promise<ListResponse<PhsDocument>> {
    const rows = await this.get<ApiPhs[]>(this.basePath);
    const items = (rows ?? []).map(phsToUi);
    return { items, total: items.length };
  }

  async listAll(): Promise<PhsDocument[]> {
    const res = await this.getAll();
    return res.items;
  }
}
