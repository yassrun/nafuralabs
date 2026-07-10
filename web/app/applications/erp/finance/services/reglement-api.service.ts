import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';

import {
  type ApiReglement,
  reglementCreateToApi,
  reglementToUi,
  reglementUpdateToApi,
} from './reglement-finance.mapper';
import type { Reglement, ReglementCreate, ReglementUpdate } from '../models';

export interface ReglementQuery {
  type?: string;
  partnerId?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ReglementApiService extends FeatureApiService<
  Reglement,
  ReglementCreate,
  ReglementUpdate
> {
  protected override basePath = '/api/v1/reglements';

  async listAll(query: ReglementQuery = {}): Promise<Reglement[]> {
    let params = new HttpParams();
    if (query.type) params = params.set('type', query.type);
    if (query.partnerId) params = params.set('partnerId', query.partnerId);
    if (query.status) params = params.set('status', query.status);
    const rows = await this.get<ApiReglement[]>(this.basePath, params);
    return (rows ?? []).map(reglementToUi);
  }

  override async getById(id: string | number): Promise<Reglement> {
    const row = await this.get<ApiReglement>(`${this.basePath}/${id}`);
    return reglementToUi(row);
  }

  override async create(data: ReglementCreate): Promise<Reglement> {
    const row = await this.post<ApiReglement>(this.basePath, reglementCreateToApi(data));
    return reglementToUi(row);
  }

  override async update(id: string | number, data: ReglementUpdate): Promise<Reglement> {
    const row = await this.put<ApiReglement>(
      `${this.basePath}/${id}`,
      reglementUpdateToApi(data),
    );
    return reglementToUi(row);
  }

  async comptabiliser(id: string): Promise<Reglement> {
    const row = await this.post<ApiReglement>(`${this.basePath}/${id}/comptabiliser`, {});
    return reglementToUi(row);
  }

  async annuler(id: string): Promise<Reglement> {
    const row = await this.post<ApiReglement>(`${this.basePath}/${id}/annuler`, {});
    return reglementToUi(row);
  }
}
