import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

export interface HeureSupplementaire {
  id: string;
  employeId: string;
  date: string;
  type: 'HS25' | 'HS50' | 'HS100';
  heures: number;
  tauxMajoration: number;
  montant: number;
  status: 'BROUILLON' | 'VALIDE' | 'INTEGREE_PAIE' | 'REJETE';
  pointageId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeureSupplementaireCreate {
  id?: string;
  employeId: string;
  date: string;
  type: 'HS25' | 'HS50' | 'HS100';
  heures: number;
  pointageId?: string;
  status?: string;
}

export interface HeureSupplementaireSynthese {
  employeId: string;
  from: string;
  to: string;
  heuresHS25: number;
  heuresHS50: number;
  heuresHS100: number;
  montantHS25: number;
  montantHS50: number;
  montantHS100: number;
  montantTotal: number;
  lignesValidees: number;
  lignesBrouillon: number;
}

@Injectable({ providedIn: 'root' })
export class HeuresSupApiService extends FeatureApiService<
  HeureSupplementaire,
  HeureSupplementaireCreate,
  never
> {
  protected override basePath = '/api/v1/rh/heures-sup';

  async list(employeId?: string, mois?: string): Promise<HeureSupplementaire[]> {
    let params = this.buildQueryParams({ page: 0, pageSize: 500 });
    if (employeId) params = params.set('employeId', employeId);
    if (mois) params = params.set('mois', mois);
    return (await this.get<HeureSupplementaire[]>(this.basePath, params)) ?? [];
  }

  override async create(data: HeureSupplementaireCreate): Promise<HeureSupplementaire> {
    return this.post<HeureSupplementaire>(this.basePath, data);
  }

  async valider(id: string): Promise<HeureSupplementaire> {
    return this.post<HeureSupplementaire>(`${this.basePath}/${id}/valider`, {});
  }

  async synthese(
    employeId: string,
    from: string,
    to: string,
  ): Promise<HeureSupplementaireSynthese> {
    const params = this.buildQueryParams({ page: 0, pageSize: 1, employeId, from, to });
    return this.get<HeureSupplementaireSynthese>(`${this.basePath}/synthese`, params);
  }
}
