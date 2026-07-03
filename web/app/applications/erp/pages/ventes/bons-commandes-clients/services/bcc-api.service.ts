import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  BonCommandeClient,
  BonCommandeClientListItem,
  BCClientCreate,
  BCClientUpdate,
} from '@applications/erp/ventes/models';

import {
  type ApiBcc,
  bccCreateToApi,
  bccToListItem,
  bccToUi,
  bccUpdateToApi,
} from './bcc.mapper';

interface BCCQuery extends ListQuery {
  status?: string;
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class BccApiService extends FeatureApiService<
  BonCommandeClient, BCClientCreate, BCClientUpdate
> {
  protected override basePath = '/api/v1/bons-commande-client';
  protected override searchFields = ['numero', 'numeroClient', 'clientName'];

  override async getAll(query?: ListQuery): Promise<ListResponse<BonCommandeClient>> {
    const q = (query ?? {}) as BCCQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.clientId) params = params.set('clientId', q.clientId);

    const rows = await this.get<ApiBcc[]>(this.basePath, params);
    const items = (rows ?? []).map(bccToListItem) as unknown as BonCommandeClient[];
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<BonCommandeClient> {
    const row = await this.get<ApiBcc>(`${this.basePath}/${id}`);
    return bccToUi(row);
  }

  override async create(data: BCClientCreate): Promise<BonCommandeClient> {
    const row = await this.post<ApiBcc>(this.basePath, bccCreateToApi(data));
    return bccToUi(row);
  }

  override async update(id: string | number, data: BCClientUpdate): Promise<BonCommandeClient> {
    const row = await this.put<ApiBcc>(`${this.basePath}/${id}`, bccUpdateToApi(data));
    return bccToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async confirm(id: string): Promise<BonCommandeClient> {
    const row = await this.post<ApiBcc>(`${this.basePath}/${id}/confirm`, {});
    return bccToUi(row);
  }

  async convertToFacture(id: string): Promise<BonCommandeClient> {
    const row = await this.post<ApiBcc>(`${this.basePath}/${id}/convert-to-facture`, {});
    return bccToUi(row);
  }
}
