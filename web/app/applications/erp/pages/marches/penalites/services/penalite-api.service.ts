import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { PenaliteMarche } from '../../models';

import { type ApiPenaliteMarche, penaliteCreateToApi, penaliteToUi } from './penalite.mapper';

interface PenaliteQuery extends ListQuery {
  contratId?: string;
  marcheId?: string;
}

@Injectable({ providedIn: 'root' })
export class PenaliteApiService extends FeatureApiService<
  PenaliteMarche, Partial<PenaliteMarche>, Partial<PenaliteMarche>
> {
  protected override basePath = '/api/v1/marches/penalites';
  protected override searchFields = ['numero', 'marcheNumero', 'motif'];

  override async getAll(query?: ListQuery): Promise<ListResponse<PenaliteMarche>> {
    const q = (query ?? {}) as PenaliteQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    const contratId = q.contratId ?? q.marcheId;
    if (contratId) params = params.set('contratId', contratId);

    const rows = await this.get<ApiPenaliteMarche[]>(this.basePath, params);
    const items = (rows ?? []).map(penaliteToUi);
    return { items, total: items.length };
  }

  override async create(data: Partial<PenaliteMarche>): Promise<PenaliteMarche> {
    const row = await this.post<ApiPenaliteMarche>(this.basePath, penaliteCreateToApi(data));
    return penaliteToUi(row);
  }

  async valider(id: string): Promise<PenaliteMarche> {
    const row = await this.post<ApiPenaliteMarche>(`${this.basePath}/${id}/valider`, {});
    return penaliteToUi(row);
  }

  async listByMarche(marcheId: string): Promise<PenaliteMarche[]> {
    const params = new HttpParams().set('contratId', marcheId);
    const rows = await this.get<ApiPenaliteMarche[]>(this.basePath, params);
    return (rows ?? []).map(penaliteToUi);
  }
}
