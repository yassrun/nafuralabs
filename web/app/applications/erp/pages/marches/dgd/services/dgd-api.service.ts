import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { DGD } from '../../models';

import { type ApiDgdMarche, dgdToUi } from './dgd.mapper';

interface DgdQuery extends ListQuery {
  contratId?: string;
  marcheId?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class DgdApiService extends FeatureApiService<DGD, never, never> {
  protected override basePath = '/api/v1/marches/dgd';

  override async getAll(query?: ListQuery): Promise<ListResponse<DGD>> {
    const q = (query ?? {}) as DgdQuery;
    let params = this.buildQueryParams(q);
    const contratId = q.contratId ?? q.marcheId;
    if (contratId) params = params.set('contratId', contratId);
    if (q.status) params = params.set('status', q.status);

    const rows = await this.get<ApiDgdMarche[]>(this.basePath, params);
    const items = (rows ?? []).map(dgdToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<DGD> {
    const row = await this.get<ApiDgdMarche>(`${this.basePath}/${id}`);
    return dgdToUi(row);
  }

  async generate(contratId: string): Promise<DGD> {
    const row = await this.post<ApiDgdMarche>(`/api/v1/marches/contrats/${contratId}/dgd/generate`, {});
    return dgdToUi(row);
  }

  async soumettreMoa(id: string): Promise<DGD> {
    const row = await this.post<ApiDgdMarche>(`${this.basePath}/${id}/soumettre-moa`, {});
    return dgdToUi(row);
  }

  async notifier(id: string): Promise<DGD> {
    const row = await this.post<ApiDgdMarche>(`${this.basePath}/${id}/notifier`, {});
    return dgdToUi(row);
  }

  async marquerPaye(id: string): Promise<DGD> {
    const row = await this.post<ApiDgdMarche>(`${this.basePath}/${id}/marquer-paye`, {});
    return dgdToUi(row);
  }

  async listByMarche(marcheId: string): Promise<DGD[]> {
    const params = new HttpParams().set('contratId', marcheId);
    const rows = await this.get<ApiDgdMarche[]>(this.basePath, params);
    return (rows ?? []).map(dgdToUi);
  }
}
