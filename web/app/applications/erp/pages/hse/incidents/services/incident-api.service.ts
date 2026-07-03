import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  Incident,
  IncidentCreate,
  IncidentUpdate,
} from '@applications/erp/hse/models';

import {
  type ApiCnssDatResult,
  type ApiIncident,
  incidentCreateToApi,
  incidentToUi,
  incidentUpdateToApi,
  mapGraviteFilter,
  mapStatusFilter,
} from './incident.mapper';

interface IncidentQuery extends ListQuery {
  status?: string;
  gravite?: string;
}

@Injectable({ providedIn: 'root' })
export class IncidentApiService extends FeatureApiService<
  Incident, IncidentCreate, IncidentUpdate
> {
  protected override basePath = '/api/v1/hse/incidents';
  protected override searchFields = ['numero', 'lieu', 'victimeNom'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Incident>> {
    const q = (query ?? {}) as IncidentQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', mapStatusFilter(q.status) ?? q.status);
    if (q.gravite) params = params.set('gravite', mapGraviteFilter(q.gravite) ?? q.gravite);

    const rows = await this.get<ApiIncident[]>(this.basePath, params);
    const items = (rows ?? []).map(incidentToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Incident> {
    const row = await this.get<ApiIncident>(`${this.basePath}/${id}`);
    return incidentToUi(row);
  }

  override async create(data: IncidentCreate): Promise<Incident> {
    const row = await this.post<ApiIncident>(this.basePath, incidentCreateToApi(data));
    return incidentToUi(row);
  }

  override async update(id: string | number, data: IncidentUpdate): Promise<Incident> {
    const row = await this.put<ApiIncident>(
      `${this.basePath}/${id}`,
      incidentUpdateToApi(data),
    );
    return incidentToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async investiguer(id: string): Promise<Incident> {
    const row = await this.post<ApiIncident>(`${this.basePath}/${id}/investiguer`, {});
    return incidentToUi(row);
  }

  async clore(id: string): Promise<Incident> {
    const row = await this.post<ApiIncident>(`${this.basePath}/${id}/clore`, {});
    return incidentToUi(row);
  }

  async declarerCnssDat(id: string): Promise<ApiCnssDatResult> {
    return this.post<ApiCnssDatResult>(`${this.basePath}/${id}/declarer-cnss-dat`, {});
  }
}
