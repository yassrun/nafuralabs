import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { FactureMarche } from '../../models';

import { type ApiFactureMarche, factureCreateToApi, factureToUi } from './facture.mapper';

interface FactureQuery extends ListQuery {
  contratId?: string;
  marcheId?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class FactureMarcheApiService extends FeatureApiService<
  FactureMarche, Partial<FactureMarche>, Partial<FactureMarche>
> {
  protected override basePath = '/api/v1/marches/factures';
  protected override searchFields = ['numero', 'marcheNumero', 'clientNom'];

  override async getAll(query?: ListQuery): Promise<ListResponse<FactureMarche>> {
    const q = (query ?? {}) as FactureQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    const contratId = q.contratId ?? q.marcheId;
    if (contratId) params = params.set('contratId', contratId);
    if (q.status) params = params.set('status', q.status);

    const rows = await this.get<ApiFactureMarche[]>(this.basePath, params);
    const items = (rows ?? []).map(factureToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<FactureMarche> {
    const row = await this.get<ApiFactureMarche>(`${this.basePath}/${id}`);
    return factureToUi(row);
  }

  override async create(data: Partial<FactureMarche>): Promise<FactureMarche> {
    const row = await this.post<ApiFactureMarche>(this.basePath, factureCreateToApi(data));
    return factureToUi(row);
  }

  async valider(id: string): Promise<FactureMarche> {
    const row = await this.post<ApiFactureMarche>(`${this.basePath}/${id}/valider`, {});
    return factureToUi(row);
  }

  async listByMarche(marcheId: string): Promise<FactureMarche[]> {
    const params = new HttpParams().set('contratId', marcheId);
    const rows = await this.get<ApiFactureMarche[]>(this.basePath, params);
    return (rows ?? []).map(factureToUi);
  }
}
