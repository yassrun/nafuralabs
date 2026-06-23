import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { CautionBancaire, CautionType } from '../../models';

import { type ApiCautionMarche, cautionCreateToApi, cautionToUi } from './caution.mapper';

interface CautionQuery extends ListQuery {
  contratId?: string;
  marcheId?: string;
  type?: CautionType | string;
}

@Injectable({ providedIn: 'root' })
export class CautionApiService extends FeatureApiService<
  CautionBancaire, Partial<CautionBancaire>, Partial<CautionBancaire>
> {
  protected override basePath = '/api/v1/marches/cautions';
  protected override searchFields = ['numero', 'marcheNumero', 'banqueEmettrice'];

  override async getAll(query?: ListQuery): Promise<ListResponse<CautionBancaire>> {
    const q = (query ?? {}) as CautionQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    const contratId = q.contratId ?? q.marcheId;
    if (contratId) params = params.set('contratId', contratId);

    const rows = await this.get<ApiCautionMarche[]>(this.basePath, params);
    const items = (rows ?? []).map(cautionToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<CautionBancaire> {
    const row = await this.get<ApiCautionMarche>(`${this.basePath}/${id}`);
    return cautionToUi(row);
  }

  override async create(data: Partial<CautionBancaire>): Promise<CautionBancaire> {
    const row = await this.post<ApiCautionMarche>(this.basePath, cautionCreateToApi(data));
    return cautionToUi(row);
  }

  async renouveler(id: string, body?: { dateExpiration?: string; montant?: number }): Promise<CautionBancaire> {
    const row = await this.post<ApiCautionMarche>(`${this.basePath}/${id}/renouveler`, body ?? {});
    return cautionToUi(row);
  }

  async demanderMainlevee(id: string): Promise<CautionBancaire> {
    const row = await this.post<ApiCautionMarche>(`${this.basePath}/${id}/demander-mainlevee`, {});
    return cautionToUi(row);
  }

  async mainlever(id: string): Promise<CautionBancaire> {
    const row = await this.post<ApiCautionMarche>(`${this.basePath}/${id}/mainlever`, {});
    return cautionToUi(row);
  }

  async expirant(days = 30): Promise<CautionBancaire[]> {
    const params = new HttpParams().set('days', String(days));
    const rows = await this.get<ApiCautionMarche[]>(`${this.basePath}/expirant`, params);
    return (rows ?? []).map(cautionToUi);
  }

  async listByMarche(marcheId: string): Promise<CautionBancaire[]> {
    const params = new HttpParams().set('contratId', marcheId);
    const rows = await this.get<ApiCautionMarche[]>(this.basePath, params);
    return (rows ?? []).map(cautionToUi);
  }
}
