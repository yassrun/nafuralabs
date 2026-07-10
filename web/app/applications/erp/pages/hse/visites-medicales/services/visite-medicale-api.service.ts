import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { VisiteMedicale } from '../../models';

export interface ApiVisiteMedicale {
  id: string;
  employeId: string;
  employeMatricule: string;
  employeNom: string;
  posteOccupe: string;
  type: string;
  date: string;
  aptitude: string;
  medecinNom: string;
  restrictions?: string;
  prochaineEcheance: string;
}

interface VisiteMedicaleQuery extends ListQuery {
  employeId?: string;
}

function toUi(row: ApiVisiteMedicale): VisiteMedicale {
  return {
    id: row.id,
    employeId: row.employeId,
    employeMatricule: row.employeMatricule,
    employeNom: row.employeNom,
    posteOccupe: row.posteOccupe,
    type: row.type as VisiteMedicale['type'],
    date: row.date,
    aptitude: row.aptitude as VisiteMedicale['aptitude'],
    medecinNom: row.medecinNom,
    restrictions: row.restrictions,
    prochaineEcheance: row.prochaineEcheance,
  };
}

@Injectable({ providedIn: 'root' })
export class VisiteMedicaleApiService extends FeatureApiService<
  VisiteMedicale,
  Partial<VisiteMedicale>,
  Partial<VisiteMedicale>
> {
  protected override basePath = '/api/v1/hse/visites-medicales';
  protected override searchFields = ['employeNom', 'employeMatricule', 'medecinNom', 'posteOccupe'];

  override async getAll(query?: ListQuery): Promise<ListResponse<VisiteMedicale>> {
    const q = (query ?? {}) as VisiteMedicaleQuery;
    const params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
      employeId: q.employeId,
    });
    const rows = await this.get<ApiVisiteMedicale[]>(this.basePath, params);
    const items = (rows ?? []).map(toUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<VisiteMedicale> {
    const row = await this.get<ApiVisiteMedicale>(`${this.basePath}/${id}`);
    return toUi(row);
  }

  async listEcheances(days = 60): Promise<VisiteMedicale[]> {
    const params = this.buildQueryParams({ page: 0, pageSize: 500, days });
    const rows = await this.get<ApiVisiteMedicale[]>(`${this.basePath}/echeances`, params);
    return (rows ?? []).map(toUi);
  }
}
