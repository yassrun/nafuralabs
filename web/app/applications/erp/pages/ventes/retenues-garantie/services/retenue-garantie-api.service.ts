import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type {
  RetenueGarantie,
  RetenueGarantieStatus,
} from '@applications/erp/ventes/models';

/** Backend row from `/api/v1/retenues-garantie`. */
export interface ApiRetenueGarantie {
  id: string;
  marcheId: string;
  clientId: string;
  factureId?: string;
  montantRetenu: number;
  cumul: number;
  montantRestitue: number;
  statut: string;
}

export interface RetenueGarantieSynthese {
  clientId?: string;
  nombreRetenues: number;
  totalCumul: number;
  totalRestitue: number;
  totalReste: number;
  immobilisees: number;
  demandeRestitution: number;
}

function mapStatut(statut: string): RetenueGarantieStatus {
  switch (statut) {
    case 'DEMANDE_RESTITUTION':
      return 'LIBERATION_DEMANDEE';
    case 'RESTITUEE_TOTAL':
      return 'LIBEREE';
    case 'RESTITUEE_PARTIEL':
      return 'EN_COURS';
    case 'IMMOBILISEE':
    default:
      return 'EN_COURS';
  }
}

export function mapApiRetenueGarantie(row: ApiRetenueGarantie): RetenueGarantie {
  const cumulRetenueHt = row.cumul ?? 0;
  const cumulLibereHt = row.montantRestitue ?? 0;
  return {
    id: row.id,
    chantierId: row.marcheId,
    clientId: row.clientId,
    bcClientId: row.factureId ?? '',
    cumulRetenueHt,
    cumulLibereHt,
    resteARelibererHt: Math.max(0, cumulRetenueHt - cumulLibereHt),
    status: mapStatut(row.statut),
  };
}

interface RetenueGarantieQuery {
  marcheId?: string;
  statut?: string;
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class RetenueGarantieApiService extends FeatureApiService<
  RetenueGarantie,
  never,
  never
> {
  protected override basePath = '/api/v1/retenues-garantie';

  async list(query?: RetenueGarantieQuery): Promise<RetenueGarantie[]> {
    let params = this.buildQueryParams({ page: 0, pageSize: 500 });
    if (query?.marcheId) params = params.set('marcheId', query.marcheId);
    if (query?.statut) params = params.set('statut', query.statut);
    if (query?.clientId) params = params.set('clientId', query.clientId);

    const rows = await this.get<ApiRetenueGarantie[]>(this.basePath, params);
    return (rows ?? []).map(mapApiRetenueGarantie);
  }

  override async getById(id: string | number): Promise<RetenueGarantie> {
    const row = await this.get<ApiRetenueGarantie>(`${this.basePath}/${id}`);
    return mapApiRetenueGarantie(row);
  }

  async synthese(clientId?: string): Promise<RetenueGarantieSynthese> {
    let params = this.buildQueryParams({ page: 0, pageSize: 500 });
    if (clientId) params = params.set('clientId', clientId);
    return this.get<RetenueGarantieSynthese>(`${this.basePath}/synthese`, params);
  }

  async demandeRestitution(id: string): Promise<RetenueGarantie> {
    const row = await this.post<ApiRetenueGarantie>(
      `${this.basePath}/${id}/demande-restitution`,
      {},
    );
    return mapApiRetenueGarantie(row);
  }

  async restituer(id: string, montant: number): Promise<RetenueGarantie> {
    const row = await this.post<ApiRetenueGarantie>(
      `${this.basePath}/${id}/restituer?montant=${montant}`,
      {},
    );
    return mapApiRetenueGarantie(row);
  }
}
