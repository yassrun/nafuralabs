import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  OffreCommerciale,
  OffreCreate,
  OffreUpdate,
} from '@applications/erp/ventes/models';

import type { BonCommandeClient } from '@applications/erp/ventes/models';

import { bccToUi } from '../../bons-commandes-clients/services/bcc.mapper';
import {
  type ApiOffre,
  type ApiOffreConvertResult,
  offreCreateToApi,
  offreToListItem,
  offreToUi,
  offreUpdateToApi,
} from './offre-commerciale.mapper';

interface OffreQuery extends ListQuery {
  status?: string;
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class OffreApiService extends FeatureApiService<
  OffreCommerciale, OffreCreate, OffreUpdate
> {
  protected override basePath = '/api/v1/offres-commerciales';
  protected override searchFields = ['numero', 'clientName', 'objet'];

  override async getAll(query?: ListQuery): Promise<ListResponse<OffreCommerciale>> {
    const q = (query ?? {}) as OffreQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.clientId) params = params.set('clientId', q.clientId);

    const rows = await this.get<ApiOffre[]>(this.basePath, params);
    const items = (rows ?? []).map(offreToListItem) as unknown as OffreCommerciale[];
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<OffreCommerciale> {
    const row = await this.get<ApiOffre>(`${this.basePath}/${id}`);
    return offreToUi(row);
  }

  override async create(data: OffreCreate): Promise<OffreCommerciale> {
    const row = await this.post<ApiOffre>(this.basePath, offreCreateToApi(data));
    return offreToUi(row);
  }

  override async update(id: string | number, data: OffreUpdate): Promise<OffreCommerciale> {
    const row = await this.put<ApiOffre>(`${this.basePath}/${id}`, offreUpdateToApi(data));
    return offreToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async send(id: string): Promise<OffreCommerciale> {
    const row = await this.post<ApiOffre>(`${this.basePath}/${id}/send`, {});
    return offreToUi(row);
  }

  async accept(id: string): Promise<OffreCommerciale> {
    const row = await this.post<ApiOffre>(`${this.basePath}/${id}/accept`, {});
    return offreToUi(row);
  }

  async refuse(id: string, motifRefus: string): Promise<OffreCommerciale> {
    const row = await this.post<ApiOffre>(`${this.basePath}/${id}/refuse`, { motifRefus });
    return offreToUi(row);
  }

  async cancel(id: string): Promise<OffreCommerciale> {
    const row = await this.post<ApiOffre>(`${this.basePath}/${id}/cancel`, {});
    return offreToUi(row);
  }

  async convertToBcc(id: string): Promise<{ offre: OffreCommerciale; bcc: BonCommandeClient }> {
    const row = await this.post<ApiOffreConvertResult>(`${this.basePath}/${id}/convert-to-bcc`, {});
    return { offre: offreToUi(row.offre), bcc: bccToUi(row.bcc) };
  }
}
