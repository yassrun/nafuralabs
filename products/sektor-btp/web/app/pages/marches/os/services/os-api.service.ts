import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { OrdreService } from '../../models';

import { type ApiOrdreServiceMarche, osCreateToApi, osToUi } from './os.mapper';

interface OsQuery extends ListQuery {
  contratId?: string;
  marcheId?: string;
}

@Injectable({ providedIn: 'root' })
export class OsApiService extends FeatureApiService<
  OrdreService, Partial<OrdreService>, Partial<OrdreService>
> {
  protected override basePath = '/api/v1/marches/os';
  protected override searchFields = ['numero', 'objet', 'chantierCode'];

  override async getAll(query?: ListQuery): Promise<ListResponse<OrdreService>> {
    const q = (query ?? {}) as OsQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    const contratId = q.contratId ?? q.marcheId;
    if (contratId) params = params.set('contratId', contratId);

    const rows = await this.get<ApiOrdreServiceMarche[]>(this.basePath, params);
    const items = (rows ?? []).map(osToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<OrdreService> {
    const row = await this.get<ApiOrdreServiceMarche>(`${this.basePath}/${id}`);
    return osToUi(row);
  }

  override async create(data: Partial<OrdreService>): Promise<OrdreService> {
    const row = await this.post<ApiOrdreServiceMarche>(this.basePath, osCreateToApi(data));
    return osToUi(row);
  }

  async notifier(id: string): Promise<OrdreService> {
    const row = await this.post<ApiOrdreServiceMarche>(`${this.basePath}/${id}/notifier`, {});
    return osToUi(row);
  }

  async listByMarche(marcheId: string): Promise<OrdreService[]> {
    const params = new HttpParams().set('contratId', marcheId);
    const rows = await this.get<ApiOrdreServiceMarche[]>(this.basePath, params);
    return (rows ?? []).map(osToUi);
  }
}
