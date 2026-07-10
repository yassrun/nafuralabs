import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { Chantier } from '@applications/erp/chantiers/models';

import {
  type ApiChantier,
  type ApiChantierSummary,
  type ChantierSummary,
  chantierCreateToApi,
  chantierSummaryToUi,
  chantierToUi,
  chantierUpdateToApi,
  mapUiStatusToBackend,
} from './chantier.mapper';

interface ChantierQuery extends ListQuery {
  status?: string;
  clientId?: string;
  societeId?: string;
}

@Injectable({ providedIn: 'root' })
export class ChantierApiService extends FeatureApiService<Chantier, Partial<Chantier>, Partial<Chantier>> {
  protected override basePath = '/api/v1/chantiers';
  protected override searchFields = ['code', 'name', 'clientName', 'ville'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Chantier>> {
    const q = (query ?? {}) as ChantierQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) {
      params = params.set('status', mapUiStatusToBackend(q.status as Chantier['status']));
    }
    if (q.clientId) params = params.set('clientId', q.clientId);
    if (q.societeId) params = params.set('societeId', q.societeId);

    const rows = await this.get<ApiChantier[]>(this.basePath, params);
    const items = (rows ?? []).map(chantierToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Chantier> {
    const row = await this.get<ApiChantier>(`${this.basePath}/${id}`);
    return chantierToUi(row);
  }

  override async create(data: Partial<Chantier>): Promise<Chantier> {
    const row = await this.post<ApiChantier>(
      this.basePath,
      chantierCreateToApi(data as Parameters<typeof chantierCreateToApi>[0]),
    );
    return chantierToUi(row);
  }

  override async update(id: string | number, data: Partial<Chantier>): Promise<Chantier> {
    const row = await this.put<ApiChantier>(`${this.basePath}/${id}`, chantierUpdateToApi(data));
    return chantierToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async lookup(search?: string): Promise<{ id: string; code: string; label: string }[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.get<{ id: string; code: string; label: string }[]>(`${this.basePath}/lookup`, params);
  }

  async demarrer(id: string): Promise<Chantier> {
    const row = await this.post<ApiChantier>(`${this.basePath}/${id}/demarrer`, {});
    return chantierToUi(row);
  }

  async suspendre(id: string): Promise<Chantier> {
    const row = await this.post<ApiChantier>(`${this.basePath}/${id}/suspendre`, {});
    return chantierToUi(row);
  }

  async reprendre(id: string): Promise<Chantier> {
    const row = await this.post<ApiChantier>(`${this.basePath}/${id}/reprendre`, {});
    return chantierToUi(row);
  }

  async receptionProvisoire(id: string): Promise<Chantier> {
    const row = await this.post<ApiChantier>(`${this.basePath}/${id}/reception-provisoire`, {});
    return chantierToUi(row);
  }

  async receptionDefinitive(id: string): Promise<Chantier> {
    const row = await this.post<ApiChantier>(`${this.basePath}/${id}/reception-definitive`, {});
    return chantierToUi(row);
  }

  async clore(id: string): Promise<Chantier> {
    const row = await this.post<ApiChantier>(`${this.basePath}/${id}/clore`, {});
    return chantierToUi(row);
  }

  async getSummary(id: string): Promise<ChantierSummary> {
    const row = await this.get<ApiChantierSummary>(`${this.basePath}/${id}/summary`);
    return chantierSummaryToUi(row);
  }
}
