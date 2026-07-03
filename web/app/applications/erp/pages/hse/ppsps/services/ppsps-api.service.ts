import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { Ppsps } from '../../models';

import {
  type ApiPpsps,
  type ApiPpspsCreate,
  type ApiPpspsSection,
  ppspsCreateToApi,
  ppspsSectionToUi,
  ppspsToUi,
} from './ppsps.mapper';

interface PpspsQuery extends ListQuery {
  chantierId?: string;
}

@Injectable({ providedIn: 'root' })
export class PpspsApiService extends FeatureApiService<Ppsps, ApiPpspsCreate, ApiPpspsCreate> {
  protected override basePath = '/api/v1/hse/ppsps';
  protected override searchFields = ['numero', 'chantierCode', 'chantierNom', 'coordonnateurSpsNom'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Ppsps>> {
    const q = (query ?? {}) as PpspsQuery;
    const params = this.buildQueryParams({
      chantierId: q.chantierId,
    });
    const rows = await this.get<ApiPpsps[]>(this.basePath, params);
    const items = (rows ?? []).map((row) => ppspsToUi(row));
    return { items, total: items.length };
  }

  async listByChantier(chantierId?: string): Promise<Ppsps[]> {
    const res = await this.getAll(chantierId ? { chantierId } : undefined);
    return res.items;
  }

  async createPpsps(data: Parameters<typeof ppspsCreateToApi>[0]): Promise<Ppsps> {
    const row = await this.post<ApiPpsps>(this.basePath, ppspsCreateToApi(data));
    return ppspsToUi(row);
  }

  async listSections(ppspsId: string): Promise<Ppsps['sections']> {
    const rows = await this.get<ApiPpspsSection[]>(`${this.basePath}/${ppspsId}/sections`);
    return (rows ?? []).map(ppspsSectionToUi);
  }

  async loadWithSections(ppspsId: string): Promise<Ppsps> {
    const rows = await this.getAll();
    const base = rows.items.find((p) => p.id === ppspsId);
    if (!base) {
      throw new Error('PPSPS not found');
    }
    const sections = await this.listSections(ppspsId);
    return { ...base, sections };
  }

  async newVersion(ppspsId: string): Promise<Ppsps> {
    const row = await this.post<ApiPpsps>(`${this.basePath}/${ppspsId}/versions`, {});
    return ppspsToUi(row);
  }
}
