import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  AppelOffre,
  AppelOffreCreate,
  AppelOffreListItem,
  AppelOffreUpdate,
  ScoringAO,
} from '@applications/erp/achats/models';

import { bcToUi, type ApiBonCommandeAchat } from '../../commandes/services/bon-commande-achat.mapper';
import {
  type ApiAppelOffreAchat,
  aoCreateToApi,
  aoToListItem,
  aoToUi,
  aoUpdateToApi,
} from './appel-offre-achat.mapper';
import type { BonCommande } from '@applications/erp/achats/models';

interface ApiAppelOffreAttribuerResult {
  ao: ApiAppelOffreAchat;
  bc: ApiBonCommandeAchat;
}

interface ApiScoreDetail {
  prix: number;
  delai: number;
  qualite: number;
  historique: number;
  art187: number;
}

interface ApiScoringOffreLigne {
  id: string;
  reponseId?: string;
  aoLigneId: string;
  prixUnitaireHt: number;
  totalHt: number;
  delaiSpecifique?: number;
}

interface ApiScoringAO {
  aoId: string;
  fournisseurId: string;
  fournisseurName?: string;
  reponseId: string;
  offre: ApiScoringOffreLigne[];
  scoreFinal: number;
  scoreDetail: ApiScoreDetail;
  recommandation: ScoringAO['recommandation'];
  raisonRecommandation: string;
}

interface ApiAppelOffreComparatif {
  aoId: string;
  scores: ApiScoringAO[];
}

function scoringNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function scoringToUi(row: ApiScoringAO): ScoringAO {
  return {
    aoId: row.aoId,
    fournisseurId: row.fournisseurId,
    fournisseurName: row.fournisseurName,
    reponseId: row.reponseId,
    offre: (row.offre ?? []).map((l) => ({
      id: l.id,
      reponseId: l.reponseId ?? row.reponseId,
      aoLigneId: l.aoLigneId,
      prixUnitaireHt: scoringNum(l.prixUnitaireHt),
      totalHt: scoringNum(l.totalHt),
      delaiSpecifique: l.delaiSpecifique,
    })),
    scoreFinal: scoringNum(row.scoreFinal),
    scoreDetail: {
      prix: scoringNum(row.scoreDetail?.prix),
      delai: scoringNum(row.scoreDetail?.delai),
      qualite: scoringNum(row.scoreDetail?.qualite),
      historique: scoringNum(row.scoreDetail?.historique),
      art187: scoringNum(row.scoreDetail?.art187),
    },
    recommandation: row.recommandation,
    raisonRecommandation: row.raisonRecommandation,
  };
}

interface AOQuery extends ListQuery {
  status?: string;
  chantierId?: string;
  quick?: 'EN_COURS' | 'ATTRIBUES' | 'A_CLOTURER';
}

@Injectable({ providedIn: 'root' })
export class AoApiService extends FeatureApiService<AppelOffre, AppelOffreCreate, AppelOffreUpdate> {
  protected override basePath = '/api/v1/appels-offres-achat';
  protected override searchFields = ['numero', 'objet', 'chantierName'];

  override async getAll(query?: ListQuery): Promise<ListResponse<AppelOffre>> {
    const q = (query ?? {}) as AOQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.chantierId) params = params.set('chantierId', q.chantierId);

    const rows = await this.get<ApiAppelOffreAchat[]>(this.basePath, params);
    let items = (rows ?? []).map(aoToListItem) as unknown as AppelOffre[];

    if (q.quick) {
      const today = new Date().toISOString().slice(0, 10);
      items = items.filter((a) => {
        switch (q.quick) {
          case 'EN_COURS':
            return ['BROUILLON', 'PUBLIEE'].includes(a.status);
          case 'A_CLOTURER':
            return a.status === 'PUBLIEE' && a.dateLimiteDepot <= today;
          case 'ATTRIBUES':
            return a.status === 'ATTRIBUEE';
          default:
            return true;
        }
      });
    }

    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<AppelOffre> {
    const row = await this.get<ApiAppelOffreAchat>(`${this.basePath}/${id}`);
    return aoToUi(row);
  }

  override async create(data: AppelOffreCreate): Promise<AppelOffre> {
    const row = await this.post<ApiAppelOffreAchat>(this.basePath, aoCreateToApi(data));
    return aoToUi(row);
  }

  override async update(id: string | number, data: AppelOffreUpdate): Promise<AppelOffre> {
    const row = await this.put<ApiAppelOffreAchat>(
      `${this.basePath}/${id}`,
      aoUpdateToApi(data),
    );
    return aoToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async publish(id: string): Promise<AppelOffre> {
    const row = await this.post<ApiAppelOffreAchat>(`${this.basePath}/${id}/publish`, {});
    return aoToUi(row);
  }

  async cloreReception(id: string): Promise<AppelOffre> {
    const row = await this.post<ApiAppelOffreAchat>(`${this.basePath}/${id}/clore-reception`, {});
    return aoToUi(row);
  }

  async attribuer(
    id: string,
    fournisseurId: string,
    fournisseurName?: string,
  ): Promise<{ ao: AppelOffre; bc: BonCommande }> {
    const row = await this.post<ApiAppelOffreAttribuerResult>(`${this.basePath}/${id}/attribuer`, {
      fournisseurId,
      fournisseurName,
    });
    return { ao: aoToUi(row.ao), bc: bcToUi(row.bc) };
  }

  async getComparatif(id: string): Promise<ScoringAO[]> {
    const row = await this.get<ApiAppelOffreComparatif>(`${this.basePath}/${id}/comparatif`);
    return (row.scores ?? []).map(scoringToUi);
  }

  async recomputeScoring(id: string): Promise<ScoringAO[]> {
    const row = await this.post<ApiAppelOffreComparatif>(`${this.basePath}/${id}/scoring/recompute`, {});
    return (row.scores ?? []).map(scoringToUi);
  }
}
