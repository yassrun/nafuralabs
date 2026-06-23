import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  ContratAchat,
  ContratAchatCreate,
  ContratAchatListItem,
  ContratAchatUpdate,
} from '@applications/erp/achats/models';

import {
  type ApiContratFournisseur,
  contratCreateToApi,
  contratToListItem,
  contratToUi,
  contratUpdateToApi,
} from './contrat-fournisseur.mapper';

interface ContratQuery extends ListQuery {
  status?: string;
  type?: string;
  quick?: 'ACTIFS' | 'EXPIRATION_PROCHE' | 'ECHUS';
}

const TODAY = '2026-05-08';

@Injectable({ providedIn: 'root' })
export class ContratApiService extends FeatureApiService<
  ContratAchat, ContratAchatCreate, ContratAchatUpdate
> {
  protected override basePath = '/api/v1/contrats-fournisseur';
  protected override searchFields = ['numero', 'objet', 'fournisseurName'];

  override async getAll(query?: ListQuery): Promise<ListResponse<ContratAchat>> {
    const q = (query ?? {}) as ContratQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.type) params = params.set('type', q.type);

    const rows = await this.get<ApiContratFournisseur[]>(this.basePath, params);
    let items = (rows ?? []).map(contratToListItem) as unknown as ContratAchat[];

    if (q.quick === 'ACTIFS') {
      items = items.filter((c) => c.status === 'EN_COURS');
    }
    if (q.quick === 'EXPIRATION_PROCHE') {
      items = items.filter(
        (c) =>
          c.status === 'EN_COURS' &&
          c.dateFin >= TODAY &&
          new Date(c.dateFin) <= new Date(new Date(TODAY).setDate(new Date(TODAY).getDate() + 30)),
      );
    }
    if (q.quick === 'ECHUS') {
      items = items.filter((c) => c.status === 'ECHU');
    }

    items.sort((a, b) => (a.dateDebut < b.dateDebut ? 1 : -1));
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<ContratAchat> {
    const row = await this.get<ApiContratFournisseur>(`${this.basePath}/${id}`);
    return contratToUi(row);
  }

  override async create(data: ContratAchatCreate): Promise<ContratAchat> {
    const row = await this.post<ApiContratFournisseur>(this.basePath, contratCreateToApi(data));
    return contratToUi(row);
  }

  override async update(id: string | number, data: ContratAchatUpdate): Promise<ContratAchat> {
    const row = await this.put<ApiContratFournisseur>(
      `${this.basePath}/${id}`,
      contratUpdateToApi(data),
    );
    return contratToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async sign(id: string): Promise<ContratAchat> {
    const row = await this.post<ApiContratFournisseur>(`${this.basePath}/${id}/sign`, {});
    return contratToUi(row);
  }

  async terminate(id: string): Promise<ContratAchat> {
    const row = await this.post<ApiContratFournisseur>(`${this.basePath}/${id}/terminate`, {});
    return contratToUi(row);
  }
}
