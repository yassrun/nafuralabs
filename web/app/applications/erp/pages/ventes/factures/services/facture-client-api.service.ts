import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  FactureClient,
  FactureCreate,
  FactureUpdate,
} from '@applications/erp/ventes/models';

/** Minimal HTTP client for `/api/v1/factures-client` (Wave 2 skeleton). */
export interface ApiFactureClient {
  id: string;
  numero: string;
  type: string;
  clientId: string;
  clientName?: string;
  bccId?: string;
  chantierId?: string;
  chantierCode?: string;
  dateEmission: string;
  dateEcheance: string;
  modePaiement?: string;
  totalHt: number;
  retenueGarantieTaux?: number;
  retenueGarantieMontant?: number;
  resorptionAvanceMontant?: number;
  netAPayerHt?: number;
  tvaTaux: number;
  totalTva: number;
  marchePublic?: boolean;
  retenueSourceTaux?: number;
  retenueSourceMontantMad?: number;
  netAPayerTtc: number;
  cumulEncaisseTtc: number;
  resteTtc: number;
  status: string;
  notes?: string;
}

interface FactureQuery extends ListQuery {
  status?: string;
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class FactureClientApiService extends FeatureApiService<
  FactureClient,
  FactureCreate,
  FactureUpdate
> {
  protected override basePath = '/api/v1/factures-client';
  protected override searchFields = ['numero', 'clientName', 'chantierCode'];

  override async getAll(query?: ListQuery): Promise<ListResponse<FactureClient>> {
    const q = (query ?? {}) as FactureQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.clientId) params = params.set('clientId', q.clientId);

    const rows = await this.get<ApiFactureClient[]>(this.basePath, params);
    const items = (rows ?? []) as unknown as FactureClient[];
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<FactureClient> {
    return this.get<FactureClient>(`${this.basePath}/${id}`);
  }

  override async create(data: FactureCreate): Promise<FactureClient> {
    return this.post<FactureClient>(this.basePath, data);
  }

  override async update(id: string | number, data: FactureUpdate): Promise<FactureClient> {
    return this.put<FactureClient>(`${this.basePath}/${id}`, data);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }
}
