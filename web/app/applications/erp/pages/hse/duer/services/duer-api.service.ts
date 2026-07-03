import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { Duer, DuerRisqueMatriceRow } from '../../models';

export interface ApiDuer {
  id: string;
  numero: string;
  chantierId: string;
  chantierCode: string;
  chantierName: string;
  version: string;
  dateRevision: string;
  auteurId: string;
  auteurNom: string;
  risquesIdentifies: number;
  actionsCorrectives: number;
  observations?: string;
  status: string;
}

export interface ApiDuerRisque {
  id: string;
  libelle: string;
  probabilite: number;
  gravite: number;
  codeActivite?: string;
  mesures?: string;
  ordre: number;
}

function duerToUi(row: ApiDuer): Duer {
  return {
    id: row.id,
    numero: row.numero,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    chantierName: row.chantierName,
    version: row.version,
    dateRevision: row.dateRevision,
    auteurId: row.auteurId,
    auteurNom: row.auteurNom,
    risquesIdentifies: row.risquesIdentifies,
    actionsCorrectives: row.actionsCorrectives,
    observations: row.observations,
    status: row.status as Duer['status'],
  };
}

function risqueToUi(row: ApiDuerRisque): DuerRisqueMatriceRow {
  const proba = Math.min(4, Math.max(1, row.probabilite)) as DuerRisqueMatriceRow['probabilite'];
  const grav = Math.min(4, Math.max(1, row.gravite)) as DuerRisqueMatriceRow['gravite'];
  return {
    id: row.id,
    libelle: row.libelle,
    codeActivite: row.codeActivite,
    probabilite: proba,
    gravite: grav,
  };
}

@Injectable({ providedIn: 'root' })
export class DuerApiService extends FeatureApiService<Duer, unknown, unknown> {
  protected override basePath = '/api/v1/hse/duer';

  async list(params?: { chantierId?: string; societeId?: string }): Promise<Duer[]> {
    const query = this.buildQueryParams(params ?? {});
    const rows = await this.get<ApiDuer[]>(this.basePath, query);
    return (rows ?? []).map(duerToUi);
  }

  override async create(input: {
    chantierId: string;
    chantierCode: string;
    chantierName: string;
    version?: string;
    dateRevision: string;
    auteurId?: string;
    auteurNom: string;
    status?: string;
  }): Promise<Duer> {
    const row = await this.post<ApiDuer>(this.basePath, input);
    return duerToUi(row);
  }

  async listRisques(duerId: string): Promise<DuerRisqueMatriceRow[]> {
    const rows = await this.get<ApiDuerRisque[]>(`${this.basePath}/${duerId}/risques`);
    return (rows ?? []).map(risqueToUi);
  }

  async replaceRisques(duerId: string, risques: DuerRisqueMatriceRow[]): Promise<void> {
    await this.put<void>(`${this.basePath}/${duerId}/risques`, {
      risques: risques.map((r) => ({
        id: r.id,
        libelle: r.libelle,
        probabilite: r.probabilite,
        gravite: r.gravite,
        codeActivite: r.codeActivite,
      })),
    });
  }
}
