import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { AffectationChantier, MaterielStatus } from '../models';

export interface ApiMaterielAffectation {
  id: string;
  materielId: string;
  materielName?: string;
  locationId?: string;
  locationName?: string;
  chantierRef: string;
  dateDebut: string;
  dateFin?: string;
  status: 'ACTIVE' | 'CLOSED';
  notes?: string;
}

export type MaterielAffectationCreateBody = {
  materielId: string;
  locationId?: string;
  locationName?: string;
  chantierRef: string;
  dateDebut: string;
  dateFin?: string;
  notes?: string;
};

@Injectable({ providedIn: 'root' })
export class MaterielAffectationApiService extends FeatureApiService<
  ApiMaterielAffectation,
  MaterielAffectationCreateBody
> {
  protected override basePath = '/api/v1/materiel-affectations';

  async list(query?: {
    materielId?: string;
    status?: 'ACTIVE' | 'CLOSED';
  }): Promise<ApiMaterielAffectation[]> {
    let params = new HttpParams();
    if (query?.materielId) {
      params = params.set('materielId', query.materielId);
    }
    if (query?.status) {
      params = params.set('status', query.status);
    }
    return this.get<ApiMaterielAffectation[]>(this.basePath, params);
  }

  async clore(id: string, dateFin?: string): Promise<ApiMaterielAffectation> {
    return this.post<ApiMaterielAffectation>(`${this.basePath}/${id}/clore`, dateFin ? { dateFin } : {});
  }
}

export function apiToAffectationChantier(row: ApiMaterielAffectation): AffectationChantier {
  const uiStatus: MaterielStatus =
    row.status === 'ACTIVE' ? 'AFFECTE' : row.dateFin ? 'DISPONIBLE' : 'HORS_SERVICE';
  return {
    id: row.id,
    materielId: row.materielId,
    materielName: row.materielName,
    locationId: row.locationId ?? '',
    locationName: row.locationName,
    chantierRef: row.chantierRef,
    dateDebut: row.dateDebut,
    dateFin: row.dateFin,
    status: uiStatus,
    notes: row.notes,
  };
}
