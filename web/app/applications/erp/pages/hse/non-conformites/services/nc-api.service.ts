import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  NonConformite,
  NonConformiteCreate,
  NonConformiteUpdate,
} from '@applications/erp/hse/models';

import {
  type ApiCapaAction,
  type ApiNonConformite,
  mapNcStatusFilter,
  ncCreateToApi,
  ncToUi,
  ncUpdateToApi,
} from './nc.mapper';

interface NCQuery extends ListQuery {
  status?: string;
  type?: string;
}

export interface CapaActionInput {
  typeCapa: 'CORRECTIVE' | 'PREVENTIVE';
  description: string;
  responsableId?: string;
  responsableNom?: string;
  dateEcheance?: string;
}

@Injectable({ providedIn: 'root' })
export class NcApiService extends FeatureApiService<
  NonConformite, NonConformiteCreate, NonConformiteUpdate
> {
  protected override basePath = '/api/v1/hse/non-conformites';
  protected override searchFields = ['numero', 'description', 'responsableNom'];

  override async getAll(query?: ListQuery): Promise<ListResponse<NonConformite>> {
    const q = (query ?? {}) as NCQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', mapNcStatusFilter(q.status) ?? q.status);
    if (q.type) params = params.set('type', q.type);

    const rows = await this.get<ApiNonConformite[]>(this.basePath, params);
    const items = (rows ?? []).map(ncToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<NonConformite> {
    const row = await this.get<ApiNonConformite>(`${this.basePath}/${id}`);
    return ncToUi(row);
  }

  override async create(data: NonConformiteCreate): Promise<NonConformite> {
    const row = await this.post<ApiNonConformite>(this.basePath, ncCreateToApi(data));
    return ncToUi(row);
  }

  override async update(id: string | number, data: NonConformiteUpdate): Promise<NonConformite> {
    const row = await this.put<ApiNonConformite>(
      `${this.basePath}/${id}`,
      ncUpdateToApi(data),
    );
    return ncToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async assigner(id: string, body?: { responsableId?: string; responsableNom?: string; dateEcheance?: string }): Promise<NonConformite> {
    const row = await this.post<ApiNonConformite>(`${this.basePath}/${id}/assigner`, body ?? {});
    return ncToUi(row);
  }

  async traiter(id: string): Promise<NonConformite> {
    const row = await this.post<ApiNonConformite>(`${this.basePath}/${id}/traiter`, {});
    return ncToUi(row);
  }

  async verifier(id: string): Promise<NonConformite> {
    const row = await this.post<ApiNonConformite>(`${this.basePath}/${id}/verifier`, {});
    return ncToUi(row);
  }

  async cloturer(id: string): Promise<NonConformite> {
    const row = await this.post<ApiNonConformite>(`${this.basePath}/${id}/cloturer`, {});
    return ncToUi(row);
  }

  async createCapa(id: string, data: CapaActionInput): Promise<ApiCapaAction> {
    return this.post<ApiCapaAction>(`${this.basePath}/${id}/capa`, data);
  }
}
