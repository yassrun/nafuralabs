import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery } from '@lib/anatomy/types';
import type { MatchingReception, MatchingTolerance } from '@applications/erp/achats/models/matching.models';
import type {
  FactureFournisseur,
  FactureFournCreate,
  FactureFournUpdate,
} from '@applications/erp/finance/models';

import {
  type ApiFactureFournisseur,
  type FfCreatePayload,
  apiFactureToUi,
  uiCreateToPayload,
  uiUpdateToPayload,
} from './ff.mapper';

@Injectable({ providedIn: 'root' })
export class FfApiService extends FeatureApiService<
  FactureFournisseur,
  FfCreatePayload,
  FfCreatePayload
> {
  protected override basePath = '/api/v1/factures-fournisseur';

  async list(query?: ListQuery): Promise<FactureFournisseur[]> {
    return this.listAll({ page: 0, pageSize: 500, ...query });
  }

  async listAll(query?: ListQuery): Promise<FactureFournisseur[]> {
    let params = this.buildQueryParams({ page: 0, pageSize: 500, ...query });
    const status = query?.['status'];
    if (status) params = params.set('status', String(status));
    const bcId = query?.['bcId'];
    if (bcId) params = params.set('bcId', String(bcId));
    const rows = await this.get<ApiFactureFournisseur[]>(this.basePath, params);
    return (rows ?? []).map(apiFactureToUi);
  }

  override async getById(id: string | number): Promise<FactureFournisseur> {
    const row = await this.get<ApiFactureFournisseur>(`${this.basePath}/${id}`);
    return apiFactureToUi(row);
  }

  async createFromUi(input: FactureFournCreate): Promise<FactureFournisseur> {
    const row = await this.post<ApiFactureFournisseur>(this.basePath, uiCreateToPayload(input));
    return apiFactureToUi(row);
  }

  async updateFromUi(id: string, patch: FactureFournUpdate, base: FactureFournisseur): Promise<FactureFournisseur> {
    const row = await this.put<ApiFactureFournisseur>(
      `${this.basePath}/${id}`,
      uiUpdateToPayload(patch, base),
    );
    return apiFactureToUi(row);
  }

  async listByBc(bcId: string, status?: string): Promise<FactureFournisseur[]> {
    return this.listAll({ page: 0, pageSize: 500, bcId, ...(status ? { status } : {}) });
  }

  async getMatching(id: string, tolerance?: MatchingTolerance): Promise<MatchingReception> {
    let params = this.buildQueryParams({ page: 0, pageSize: 500 });
    if (tolerance?.pricePct != null) params = params.set('pricePct', String(tolerance.pricePct));
    if (tolerance?.qtyPct != null) params = params.set('qtyPct', String(tolerance.qtyPct));
    return this.get<MatchingReception>(`${this.basePath}/${id}/matching`, params);
  }

  async getMatchingByBc(bcId: string, tolerance?: MatchingTolerance): Promise<MatchingReception> {
    let params = this.buildQueryParams({ page: 0, pageSize: 500 });
    if (tolerance?.pricePct != null) params = params.set('pricePct', String(tolerance.pricePct));
    if (tolerance?.qtyPct != null) params = params.set('qtyPct', String(tolerance.qtyPct));
    return this.get<MatchingReception>(`${this.basePath}/matching/by-bc/${bcId}`, params);
  }

  async recomputeMatching(id: string, tolerance?: MatchingTolerance): Promise<MatchingReception> {
    return this.post<MatchingReception>(`${this.basePath}/${id}/matching/recompute`, tolerance ?? {});
  }

  async validate(id: string): Promise<FactureFournisseur> {
    const row = await this.post<ApiFactureFournisseur>(`${this.basePath}/${id}/validate`, {});
    return apiFactureToUi(row);
  }

  async litige(id: string, motif: string): Promise<FactureFournisseur> {
    const row = await this.post<ApiFactureFournisseur>(`${this.basePath}/${id}/litige`, { motif });
    return apiFactureToUi(row);
  }

  async cancel(id: string): Promise<FactureFournisseur> {
    const row = await this.post<ApiFactureFournisseur>(`${this.basePath}/${id}/cancel`, {});
    return apiFactureToUi(row);
  }

  async comptabiliser(id: string): Promise<FactureFournisseur> {
    const row = await this.post<ApiFactureFournisseur>(`${this.basePath}/${id}/comptabiliser`, {});
    return apiFactureToUi(row);
  }
}
