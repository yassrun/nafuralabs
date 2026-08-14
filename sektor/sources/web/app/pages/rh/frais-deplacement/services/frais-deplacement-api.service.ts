import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';

export type TypeFraisDeplacement = 'INDEMNITE_KM' | 'PANIER_REPAS' | 'HEBERGEMENT';
export type StatutFraisDeplacement = 'BROUILLON' | 'SOUMIS' | 'APPROUVE' | 'REJETE' | 'INTEGRE';

export interface FraisDeplacement {
  id: string;
  employeId: string;
  employeNom?: string;
  type: TypeFraisDeplacement;
  date: string;
  montant: number;
  km?: number;
  status: StatutFraisDeplacement;
  motifRejet?: string;
}

export type FraisDeplacementCreate = Omit<FraisDeplacement, 'id'>;
export type FraisDeplacementUpdate = Partial<FraisDeplacementCreate>;

interface FraisDeplacementQuery extends ListQuery {
  status?: string;
  employeId?: string;
}

@Injectable({ providedIn: 'root' })
export class FraisDeplacementApiService extends FeatureApiService<
  FraisDeplacement,
  FraisDeplacementCreate,
  FraisDeplacementUpdate
> {
  protected override basePath = '/api/v1/rh/frais-deplacement';

  override async getAll(query?: ListQuery): Promise<ListResponse<FraisDeplacement>> {
    const q = (query ?? {}) as FraisDeplacementQuery;
    let params = this.buildQueryParams(q);
    if (q.status) params = params.set('status', q.status);
    if (q.employeId) params = params.set('employeId', q.employeId);

    const rows = await this.get<FraisDeplacement[]>(this.basePath, params);
    const items = rows ?? [];
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<FraisDeplacement> {
    return this.get<FraisDeplacement>(`${this.basePath}/${id}`);
  }

  override async create(data: FraisDeplacementCreate): Promise<FraisDeplacement> {
    return this.post<FraisDeplacement>(this.basePath, data);
  }

  override async update(id: string | number, data: FraisDeplacementUpdate): Promise<FraisDeplacement> {
    return this.put<FraisDeplacement>(`${this.basePath}/${id}`, data);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async submit(id: string | number): Promise<FraisDeplacement> {
    return this.post<FraisDeplacement>(`${this.basePath}/${id}/submit`, {});
  }

  async approve(id: string | number): Promise<FraisDeplacement> {
    return this.post<FraisDeplacement>(`${this.basePath}/${id}/approve`, {});
  }

  async reject(id: string | number, motifRejet: string): Promise<FraisDeplacement> {
    return this.post<FraisDeplacement>(`${this.basePath}/${id}/reject`, { motifRejet });
  }

  async integrerPaie(id: string | number): Promise<FraisDeplacement> {
    return this.post<FraisDeplacement>(`${this.basePath}/${id}/integrer-paie`, {});
  }
}
