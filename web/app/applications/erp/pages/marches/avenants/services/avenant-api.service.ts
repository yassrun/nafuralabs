import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { Avenant, AvenantStatus } from '../../models';

import {
  type ApiAvenant,
  type ApiAvenantImpactSimulation,
  avenantCreateToApi,
  avenantToUi,
  mapUiAvenantStatusToBackend,
} from './avenant.mapper';

interface AvenantQuery extends ListQuery {
  contratMarcheId?: string;
  marcheId?: string;
  status?: AvenantStatus | string;
}

@Injectable({ providedIn: 'root' })
export class AvenantApiService extends FeatureApiService<
  Avenant, Partial<Avenant>, Partial<Avenant>
> {
  protected override basePath = '/api/v1/marches/avenants';
  protected override searchFields = ['numero', 'marcheNumero', 'objet'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Avenant>> {
    const q = (query ?? {}) as AvenantQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    const contratId = q.contratMarcheId ?? q.marcheId;
    if (contratId) params = params.set('contratMarcheId', contratId);
    if (q.status) params = params.set('status', mapUiAvenantStatusToBackend(q.status as AvenantStatus));

    const rows = await this.get<ApiAvenant[]>(this.basePath, params);
    const items = (rows ?? []).map(avenantToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Avenant> {
    const row = await this.get<ApiAvenant>(`${this.basePath}/${id}`);
    return avenantToUi(row);
  }

  override async create(data: Partial<Avenant>): Promise<Avenant> {
    const row = await this.post<ApiAvenant>(this.basePath, avenantCreateToApi(data));
    return avenantToUi(row);
  }

  async soumettreMoa(id: string): Promise<Avenant> {
    const row = await this.post<ApiAvenant>(`${this.basePath}/${id}/soumettre-moa`, {});
    return avenantToUi(row);
  }

  async signer(id: string): Promise<Avenant> {
    const row = await this.post<ApiAvenant>(`${this.basePath}/${id}/signer`, {});
    return avenantToUi(row);
  }

  async propagerImpact(id: string): Promise<Avenant> {
    const row = await this.post<ApiAvenant>(`${this.basePath}/${id}/propager-impact`, {});
    return avenantToUi(row);
  }

  async annuler(id: string): Promise<Avenant> {
    const row = await this.post<ApiAvenant>(`${this.basePath}/${id}/annuler`, {});
    return avenantToUi(row);
  }

  async impactSimulation(id: string): Promise<ApiAvenantImpactSimulation> {
    return this.get<ApiAvenantImpactSimulation>(`${this.basePath}/${id}/impact-simulation`);
  }

  async listByMarche(marcheId: string): Promise<Avenant[]> {
    const params = new HttpParams().set('contratMarcheId', marcheId);
    const rows = await this.get<ApiAvenant[]>(this.basePath, params);
    return (rows ?? []).map(avenantToUi);
  }
}
