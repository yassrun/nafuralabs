/**
 * Matériel API Service — HTTP CRUD via `/api/v1/materiels`
 */

import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';

import type { Materiel, MaterielCreate, MaterielUpdate } from '../models';
import type { MaterielQuery } from '../models';

export interface ApiMateriel {
  id: string;
  code: string;
  name: string;
  description?: string;
  familleId?: string;
  familleName?: string;
  marque?: string;
  modele?: string;
  numeroSerie: string;
  anneeMiseEnService?: number;
  puissanceCapacite?: string;
  status: string;
  dateDernierEntretien?: string;
  prochaineMaintenance?: string;
  notesMaintenance?: string;
  chantierActuelId?: string;
  chantierActuelName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MaterielApiService extends FeatureApiService<Materiel, MaterielCreate, MaterielUpdate> {
  protected override basePath = '/api/v1/materiels';
  protected override searchFields = ['code', 'name', 'numeroSerie', 'marque', 'modele'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Materiel>> {
    const q = (query ?? {}) as MaterielQuery;
    let params = new HttpParams()
      .set('page', String((q.page ?? 1) > 0 ? (q.page ?? 1) - 1 : 0))
      .set('size', String(q.pageSize && q.pageSize > 0 ? q.pageSize : 20));

    if (q.search) {
      params = params.set('search', q.search);
    }
    if (q.status) {
      params = params.set('status', q.status);
    }
    if (q.familleId) {
      params = params.set('familleId', q.familleId);
    }
    if (q.sortBy) {
      const dir = q.sortDirection === 'desc' ? 'desc' : 'asc';
      params = params.set('sort', `${q.sortBy},${dir}`);
    }

    const response = await this.get<unknown>(this.basePath, params);
    const normalized = this.normalizeListResponse(response);
    return {
      items: (normalized.items as ApiMateriel[]).map(apiToMateriel),
      total: normalized.total,
    };
  }

  override async getById(id: string | number): Promise<Materiel> {
    const row = await this.get<ApiMateriel>(`${this.basePath}/${id}`);
    return apiToMateriel(row);
  }

  override async create(data: MaterielCreate): Promise<Materiel> {
    const row = await this.post<ApiMateriel>(this.basePath, materielToCreateBody(data));
    return apiToMateriel(row);
  }

  override async update(id: string | number, data: MaterielUpdate): Promise<Materiel> {
    const row = await this.put<ApiMateriel>(`${this.basePath}/${id}`, data);
    return apiToMateriel(row);
  }
}

export function apiToMateriel(row: ApiMateriel): Materiel {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    familleId: row.familleId,
    familleName: row.familleName,
    marque: row.marque,
    modele: row.modele,
    numeroSerie: row.numeroSerie,
    anneeMiseEnService: row.anneeMiseEnService,
    puissanceCapacite: row.puissanceCapacite,
    status: row.status as Materiel['status'],
    dateDernierEntretien: row.dateDernierEntretien,
    prochaineMaintenance: row.prochaineMaintenance,
    notesMaintenance: row.notesMaintenance,
    chantierActuelId: row.chantierActuelId,
    chantierActuelName: row.chantierActuelName,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function materielToCreateBody(data: MaterielCreate): Record<string, unknown> {
  return { ...data };
}
