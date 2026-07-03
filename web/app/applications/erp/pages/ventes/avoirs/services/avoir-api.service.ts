import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  Avoir,
  AvoirCreate,
  AvoirUpdate,
} from '@applications/erp/ventes/models';

interface AvoirQuery extends ListQuery {
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class AvoirApiService extends FeatureApiService<
  Avoir,
  AvoirCreate,
  AvoirUpdate
> {
  protected override basePath = '/api/v1/ventes/avoirs';
  protected override searchFields = ['numero', 'clientName', 'factureOriginaleNumero', 'motif'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Avoir>> {
    const q = (query ?? {}) as AvoirQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.clientId) params = params.set('clientId', q.clientId);
    if (q.dateFrom) params = params.set('dateFrom', q.dateFrom);
    if (q.dateTo) params = params.set('dateTo', q.dateTo);

    const rows = await this.get<Avoir[]>(this.basePath, params);
    const items = (rows ?? []).map((a) => ({
      ...a,
      lignes: a.lignes ?? [],
    }));
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Avoir> {
    const row = await this.get<Avoir>(`${this.basePath}/${id}`);
    return { ...row, lignes: row.lignes ?? [] };
  }
}
