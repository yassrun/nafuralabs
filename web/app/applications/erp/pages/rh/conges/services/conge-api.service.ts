import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { Conge, CongeCreate, CongeUpdate } from '@applications/erp/rh/models';

interface CongeQuery extends ListQuery {
  status?: string;
  type?: string;
  employeId?: string;
}

@Injectable({ providedIn: 'root' })
export class CongeApiService extends FeatureApiService<Conge, CongeCreate, CongeUpdate> {
  protected override basePath = '/api/v1/rh/conges';
  protected override searchFields = ['numero', 'employeNom'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Conge>> {
    const q = (query ?? {}) as CongeQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.type) params = params.set('type', q.type);
    if (q.employeId) params = params.set('employeId', q.employeId);

    const rows = await this.get<Conge[]>(this.basePath, params);
    const items = rows ?? [];
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Conge> {
    return this.get<Conge>(`${this.basePath}/${id}`);
  }

  override async create(data: CongeCreate): Promise<Conge> {
    return this.post<Conge>(this.basePath, data);
  }

  override async update(id: string | number, data: CongeUpdate): Promise<Conge> {
    return this.put<Conge>(`${this.basePath}/${id}`, data);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async submit(id: string | number): Promise<Conge> {
    return this.post<Conge>(`${this.basePath}/${id}/submit`, {});
  }

  async approve(id: string | number): Promise<Conge> {
    return this.post<Conge>(`${this.basePath}/${id}/approve`, {});
  }

  async reject(id: string | number, motifRefus: string): Promise<Conge> {
    return this.post<Conge>(`${this.basePath}/${id}/reject`, { motifRefus });
  }
}
