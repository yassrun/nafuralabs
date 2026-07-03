import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { FichePaie, FichePaieCreate, FichePaieUpdate } from '@applications/erp/rh/models';

interface PaieQuery extends ListQuery {
  status?: string;
  employeId?: string;
  mois?: string;
}

@Injectable({ providedIn: 'root' })
export class PaieApiService extends FeatureApiService<FichePaie, FichePaieCreate, FichePaieUpdate> {
  protected override basePath = '/api/v1/rh/fiches-paie';
  protected override searchFields = ['numero', 'employeNom', 'mois'];

  override async getAll(query?: ListQuery): Promise<ListResponse<FichePaie>> {
    const q = (query ?? {}) as PaieQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.employeId) params = params.set('employeId', q.employeId);
    if (q.mois) params = params.set('mois', q.mois);

    const rows = await this.get<FichePaie[]>(this.basePath, params);
    const items = rows ?? [];
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<FichePaie> {
    return this.get<FichePaie>(`${this.basePath}/${id}`);
  }

  override async create(data: FichePaieCreate): Promise<FichePaie> {
    return this.post<FichePaie>(this.basePath, data);
  }

  override async update(id: string | number, data: FichePaieUpdate): Promise<FichePaie> {
    return this.put<FichePaie>(`${this.basePath}/${id}`, data);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async generate(mois: string): Promise<FichePaie[]> {
    return this.post<FichePaie[]>(`${this.basePath}/generate?mois=${encodeURIComponent(mois)}`, {});
  }

  async valider(id: string | number): Promise<FichePaie> {
    return this.post<FichePaie>(`${this.basePath}/${id}/valider`, {});
  }

  async payer(id: string | number): Promise<FichePaie> {
    return this.post<FichePaie>(`${this.basePath}/${id}/payer`, {});
  }
}
