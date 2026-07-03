import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  DemandeAchat,
  DemandeAchatCreate,
  DemandeAchatListItem,
  DemandeAchatUpdate,
} from '@applications/erp/achats/models';

import {
  type ApiDemandeAchat,
  demandeCreateToApi,
  demandeToListItem,
  demandeToUi,
  demandeUpdateToApi,
} from './demande-achat.mapper';

interface DAQuery extends ListQuery {
  status?: string;
  chantierId?: string;
  quick?: 'A_APPROUVER' | 'MES_DEMANDES' | 'URGENT' | 'NON_CONVERTIES';
}

@Injectable({ providedIn: 'root' })
export class DemandeApiService extends FeatureApiService<
  DemandeAchat, DemandeAchatCreate, DemandeAchatUpdate
> {
  protected override basePath = '/api/v1/demandes-achat';
  protected override searchFields = ['numero', 'chantierName', 'demandeurName', 'motif'];

  override async getAll(query?: ListQuery): Promise<ListResponse<DemandeAchat>> {
    const q = (query ?? {}) as DAQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.chantierId) params = params.set('chantierId', q.chantierId);

    const rows = await this.get<ApiDemandeAchat[]>(this.basePath, params);
    let items = (rows ?? []).map(demandeToListItem) as unknown as DemandeAchat[];

    if (q.quick) {
      const today = new Date();
      items = items.filter((d) => {
        switch (q.quick) {
          case 'A_APPROUVER':
            return d.status === 'SOUMISE';
          case 'NON_CONVERTIES':
            return d.status === 'APPROUVEE';
          case 'URGENT': {
            const daysUntil =
              (new Date(d.dateBesoin).getTime() - today.getTime()) / 86400000;
            return daysUntil <= 7 && d.status !== 'CONVERTIE';
          }
          case 'MES_DEMANDES':
            return d.demandeurId === 'emp001';
          default:
            return true;
        }
      });
    }

    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<DemandeAchat> {
    const row = await this.get<ApiDemandeAchat>(`${this.basePath}/${id}`);
    return demandeToUi(row);
  }

  override async create(data: DemandeAchatCreate): Promise<DemandeAchat> {
    const row = await this.post<ApiDemandeAchat>(this.basePath, demandeCreateToApi(data));
    return demandeToUi(row);
  }

  override async update(id: string | number, data: DemandeAchatUpdate): Promise<DemandeAchat> {
    const row = await this.put<ApiDemandeAchat>(
      `${this.basePath}/${id}`,
      demandeUpdateToApi(data),
    );
    return demandeToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async submit(id: string): Promise<DemandeAchat> {
    const row = await this.post<ApiDemandeAchat>(`${this.basePath}/${id}/submit`, {});
    return demandeToUi(row);
  }

  async approve(id: string, approbateurName?: string): Promise<DemandeAchat> {
    const row = await this.post<ApiDemandeAchat>(`${this.basePath}/${id}/approve`, {
      approbateurName,
    });
    return demandeToUi(row);
  }

  async reject(id: string, motifRejet: string): Promise<DemandeAchat> {
    const row = await this.post<ApiDemandeAchat>(`${this.basePath}/${id}/reject`, { motifRejet });
    return demandeToUi(row);
  }

  async convertToAo(id: string): Promise<DemandeAchat> {
    const row = await this.post<ApiDemandeAchat>(`${this.basePath}/${id}/convert-to-ao`, {});
    return demandeToUi(row);
  }
}
