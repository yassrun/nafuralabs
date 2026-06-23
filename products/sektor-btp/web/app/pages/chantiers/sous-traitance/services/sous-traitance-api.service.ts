import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';

import type { ContratSousTraitance } from '../models';

interface ApiContratSousTraitance {
  id: string;
  numero: string;
  sousTraitantId: string;
  sousTraitantNom: string;
  ice?: string;
  chantierId: string;
  chantierCode: string;
  chantierNom: string;
  objet: string;
  montantHt: number;
  retenueGarantieTaux: number;
  dateSignature?: string;
  dateDebut: string;
  dateFin: string;
  avancementPercent: number;
  status: string;
  declarationArt187: boolean;
}

export interface SousTraitanceSynthese {
  count: number;
  montantTotalHt: number;
  cumulRetenueGarantie: number;
}

function apiToContrat(row: ApiContratSousTraitance): ContratSousTraitance {
  return {
    id: row.id,
    numero: row.numero,
    sousTraitantId: row.sousTraitantId,
    sousTraitantNom: row.sousTraitantNom,
    ice: row.ice,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    chantierNom: row.chantierNom,
    objet: row.objet,
    montantHt: Number(row.montantHt ?? 0),
    retenueGarantieTaux: Number(row.retenueGarantieTaux ?? 0),
    dateSignature: row.dateSignature,
    dateDebut: row.dateDebut,
    dateFin: row.dateFin,
    avancementPercent: Number(row.avancementPercent ?? 0),
    status: row.status as ContratSousTraitance['status'],
    declarationArt187: Boolean(row.declarationArt187),
  };
}

@Injectable({ providedIn: 'root' })
export class SousTraitanceApiService extends FeatureApiService<
  ContratSousTraitance,
  Partial<ContratSousTraitance>
> {
  protected override basePath = '/api/v1/chantiers/sous-traitances';

  override async getAll(_query?: ListQuery): Promise<ListResponse<ContratSousTraitance>> {
    const rows = await this.get<ApiContratSousTraitance[]>(this.basePath);
    const items = (rows ?? []).map(apiToContrat);
    return { items, total: items.length };
  }

  async listByChantier(chantierId: string): Promise<ContratSousTraitance[]> {
    const rows = await this.get<ApiContratSousTraitance[]>(
      `/api/v1/chantiers/${chantierId}/sous-traitances`,
    );
    return (rows ?? []).map(apiToContrat);
  }

  async createForChantier(
    chantierId: string,
    data: Partial<ContratSousTraitance>,
  ): Promise<ContratSousTraitance> {
    const row = await this.post<ApiContratSousTraitance>(
      `/api/v1/chantiers/${chantierId}/sous-traitances`,
      {
        sousTraitantId: data.sousTraitantId,
        sousTraitantNom: data.sousTraitantNom,
        ice: data.ice,
        objet: data.objet,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        dateSignature: data.dateSignature,
        montantHt: data.montantHt,
        retenueGarantieTaux: data.retenueGarantieTaux,
        status: data.status,
        declarationArt187: data.declarationArt187,
        avancementPercent: data.avancementPercent,
      },
    );
    return apiToContrat(row);
  }

  async getSynthese(chantierId: string): Promise<SousTraitanceSynthese> {
    const row = await this.get<SousTraitanceSynthese>(
      `/api/v1/chantiers/${chantierId}/sous-traitances/synthese`,
    );
    return {
      count: Number(row.count ?? 0),
      montantTotalHt: Number(row.montantTotalHt ?? 0),
      cumulRetenueGarantie: Number(row.cumulRetenueGarantie ?? 0),
    };
  }
}
