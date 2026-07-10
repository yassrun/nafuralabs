import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  Formation,
  FormationCreate,
  FormationUpdate,
} from '@applications/erp/hse/models';

import {
  type ApiFormation,
  formationCreateToApi,
  formationToUi,
  formationUpdateToApi,
} from './formation.mapper';

interface FormationQuery extends ListQuery {
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class FormationApiService extends FeatureApiService<
  Formation, FormationCreate, FormationUpdate
> {
  protected override basePath = '/api/v1/hse/formations';
  protected override searchFields = ['numero', 'titre', 'formateur'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Formation>> {
    const q = (query ?? {}) as FormationQuery;
    const params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
      status: q.status,
    });
    const rows = await this.get<ApiFormation[]>(this.basePath, params);
    const items = (rows ?? []).map(formationToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Formation> {
    const row = await this.get<ApiFormation>(`${this.basePath}/${id}`);
    return formationToUi(row);
  }

  override async create(data: FormationCreate): Promise<Formation> {
    const row = await this.post<ApiFormation>(this.basePath, formationCreateToApi(data));
    return formationToUi(row);
  }

  override async update(id: string | number, data: FormationUpdate): Promise<Formation> {
    const row = await this.put<ApiFormation>(
      `${this.basePath}/${id}`,
      formationUpdateToApi(data),
    );
    return formationToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async cloturer(id: string): Promise<Formation> {
    const row = await this.post<ApiFormation>(`${this.basePath}/${id}/cloturer`, {});
    return formationToUi(row);
  }

  async listExpirant(days = 30): Promise<Formation[]> {
    const params = this.buildQueryParams({ page: 0, pageSize: 500, days });
    const rows = await this.get<ApiFormation[]>(`${this.basePath}/expirant`, params);
    return (rows ?? []).map(formationToUi);
  }
}
