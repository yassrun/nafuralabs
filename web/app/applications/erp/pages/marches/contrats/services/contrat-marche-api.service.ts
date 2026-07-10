import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { Marche, MarcheStatus } from '../../models';

import {
  type ApiBpuLigne,
  type ApiContratMarche,
  contratMarcheCreateToApi,
  contratMarcheToUi,
  contratMarcheUpdateToApi,
  mapUiStatusToBackend,
} from './contrat-marche.mapper';

interface ContratMarcheQuery extends ListQuery {
  status?: MarcheStatus | string;
  chantierId?: string;
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class ContratMarcheApiService extends FeatureApiService<
  Marche, Partial<Marche>, Partial<Marche>
> {
  protected override basePath = '/api/v1/marches/contrats';
  protected override searchFields = ['numero', 'intitule', 'chantierCode', 'clientNom'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Marche>> {
    const q = (query ?? {}) as ContratMarcheQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) {
      params = params.set('status', mapUiStatusToBackend(q.status as MarcheStatus));
    }
    if (q.chantierId) params = params.set('chantierId', q.chantierId);
    if (q.clientId) params = params.set('clientId', q.clientId);

    const rows = await this.get<ApiContratMarche[]>(this.basePath, params);
    const items = (rows ?? []).map(contratMarcheToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Marche> {
    const row = await this.get<ApiContratMarche>(`${this.basePath}/${id}`);
    return contratMarcheToUi(row);
  }

  override async create(data: Partial<Marche>): Promise<Marche> {
    const row = await this.post<ApiContratMarche>(this.basePath, contratMarcheCreateToApi(data));
    return contratMarcheToUi(row);
  }

  override async update(id: string | number, data: Partial<Marche>): Promise<Marche> {
    const row = await this.put<ApiContratMarche>(
      `${this.basePath}/${id}`,
      contratMarcheUpdateToApi(data),
    );
    return contratMarcheToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async notifier(id: string): Promise<Marche> {
    const row = await this.post<ApiContratMarche>(`${this.basePath}/${id}/notifier`, {});
    return contratMarcheToUi(row);
  }

  async cloturer(id: string): Promise<Marche> {
    const row = await this.post<ApiContratMarche>(`${this.basePath}/${id}/cloturer`, {});
    return contratMarcheToUi(row);
  }

  async listLignes(contratId: string): Promise<ApiBpuLigne[]> {
    return this.get<ApiBpuLigne[]>(`${this.basePath}/${contratId}/lignes`);
  }

  async addLigne(contratId: string, ligne: Partial<ApiBpuLigne>): Promise<ApiBpuLigne> {
    return this.post<ApiBpuLigne>(`${this.basePath}/${contratId}/lignes`, ligne);
  }
}
