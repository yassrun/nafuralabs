import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  Inspection,
  InspectionCreate,
  InspectionUpdate,
} from '@applications/erp/hse/models';

import {
  type ApiInspection,
  inspectionCreateToApi,
  inspectionToUi,
  inspectionUpdateToApi,
} from './inspection.mapper';

interface InspectionQuery extends ListQuery {
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class InspectionApiService extends FeatureApiService<
  Inspection, InspectionCreate, InspectionUpdate
> {
  protected override basePath = '/api/v1/hse/inspections';
  protected override searchFields = ['numero', 'inspecteurNom', 'thematique'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Inspection>> {
    const q = (query ?? {}) as InspectionQuery;
    const params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
      status: q.status,
    });

    const rows = await this.get<ApiInspection[]>(this.basePath, params);
    const items = (rows ?? []).map(inspectionToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Inspection> {
    const row = await this.get<ApiInspection>(`${this.basePath}/${id}`);
    return inspectionToUi(row);
  }

  override async create(data: InspectionCreate): Promise<Inspection> {
    const row = await this.post<ApiInspection>(this.basePath, inspectionCreateToApi(data));
    return inspectionToUi(row);
  }

  override async update(id: string | number, data: InspectionUpdate): Promise<Inspection> {
    const row = await this.put<ApiInspection>(
      `${this.basePath}/${id}`,
      inspectionUpdateToApi(data),
    );
    return inspectionToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }
}
