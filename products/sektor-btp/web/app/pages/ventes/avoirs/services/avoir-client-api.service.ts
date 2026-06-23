import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  Avoir,
  AvoirCreate,
  AvoirListItem,
  AvoirUpdate,
} from '@applications/erp/ventes/models';

function toListItem(a: Avoir): AvoirListItem {
  return {
    id: a.id,
    numero: a.numero,
    factureOriginaleId: a.factureOriginaleId,
    factureOriginaleNumero: a.factureOriginaleNumero,
    clientId: a.clientId,
    clientName: a.clientName,
    dateEmission: a.dateEmission,
    motif: a.motif,
    totalHt: a.totalHt,
    tvaTaux: a.tvaTaux,
    totalTva: a.totalTva,
    totalTtc: a.totalTtc,
    status: a.status,
    notes: a.notes,
    nbLignes: a.lignes?.length ?? 0,
  };
}

/** Minimal HTTP client for `/api/v1/avoirs-client` (Wave 2 skeleton). */
export interface ApiAvoirClient {
  id: string;
  numero: string;
  factureOriginaleId: string;
  factureOriginaleNumero?: string;
  clientId: string;
  clientName?: string;
  dateEmission: string;
  motif: string;
  totalHt: number;
  tvaTaux: number;
  totalTva: number;
  totalTtc: number;
  status: string;
  notes?: string;
}

interface AvoirQuery extends ListQuery {
  status?: string;
  clientId?: string;
  factureOriginaleId?: string;
}

@Injectable({ providedIn: 'root' })
export class AvoirClientApiService extends FeatureApiService<
  Avoir,
  AvoirCreate,
  AvoirUpdate
> {
  protected override basePath = '/api/v1/avoirs-client';
  protected override searchFields = [
    'numero',
    'clientName',
    'factureOriginaleNumero',
    'motif',
  ];

  override async getAll(query?: ListQuery): Promise<ListResponse<Avoir>> {
    const q = (query ?? {}) as AvoirQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.clientId) params = params.set('clientId', q.clientId);
    if (q.factureOriginaleId) {
      params = params.set('factureOriginaleId', q.factureOriginaleId);
    }

    const rows = await this.get<ApiAvoirClient[]>(this.basePath, params);
    const items = (rows ?? []).map((r) => toListItem(r as unknown as Avoir)) as unknown as Avoir[];
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Avoir> {
    const row = await this.get<Avoir>(`${this.basePath}/${id}`);
    return { ...row, lignes: row.lignes ?? [] };
  }

  override async create(data: AvoirCreate): Promise<Avoir> {
    return this.post<Avoir>(this.basePath, data);
  }

  override async update(id: string | number, data: AvoirUpdate): Promise<Avoir> {
    return this.put<Avoir>(`${this.basePath}/${id}`, data);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async listByFacture(factureId: string): Promise<Avoir[]> {
    return this.get<Avoir[]>(`${this.basePath}/by-facture/${factureId}`);
  }
}
