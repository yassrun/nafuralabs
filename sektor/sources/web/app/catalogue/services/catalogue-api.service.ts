import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';

export interface CatalogEdition {
  id: string;
  code: string;
  statut: string;
  publieLe?: string | null;
  notes?: string | null;
}

export interface CatalogArticle {
  id: string;
  cleStable: string;
  nature: string;
  libelle: string;
  uniteCode: string;
  codeFamille?: string | null;
  statut: string;
  editionPublication?: string | null;
}

export interface CatalogOuvrage {
  id: string;
  cleStable: string;
  libelle: string;
  uniteCode: string;
  codeLot?: string | null;
  codeFamille?: string | null;
  statut: string;
  editionPublication?: string | null;
}

export interface CatalogCandidat {
  id: string;
  libellePropose: string;
  nature?: string | null;
  uniteCode?: string | null;
  codeFamille?: string | null;
  typeObjet: string;
  nbTenantsConfirmants: number;
  seuilRequis: number;
  eligible: boolean;
  exemplesLibelles?: string | null;
  rendementMin?: number | null;
  rendementMax?: number | null;
  rendementMedian?: number | null;
  statut: string;
  proposePar: string;
  modelVersion?: string | null;
  catalogCleCreee?: string | null;
  createdAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogueApiService extends FeatureApiService<CatalogArticle> {
  protected override basePath = '/api/v1/catalogue';

  editions(): Promise<CatalogEdition[]> {
    return this.get<CatalogEdition[]>(`${this.basePath}/editions`);
  }

  articles(statut = 'PUBLIE'): Promise<CatalogArticle[]> {
    return this.get<CatalogArticle[]>(`${this.basePath}/articles?statut=${encodeURIComponent(statut)}`);
  }

  ouvrages(statut = 'PUBLIE'): Promise<CatalogOuvrage[]> {
    return this.get<CatalogOuvrage[]>(`${this.basePath}/ouvrages?statut=${encodeURIComponent(statut)}`);
  }

  candidats(): Promise<CatalogCandidat[]> {
    return this.get<CatalogCandidat[]>(`${this.basePath}/candidats`);
  }

  publier(id: string, editionCode?: string): Promise<CatalogCandidat> {
    return this.post<CatalogCandidat>(`${this.basePath}/candidats/${id}/publier`, {
      editionCode: editionCode ?? null,
    });
  }

  refuser(id: string): Promise<CatalogCandidat> {
    return this.post<CatalogCandidat>(`${this.basePath}/candidats/${id}/refuser`, {});
  }

  seedDemo(): Promise<Record<string, unknown>> {
    return this.post<Record<string, unknown>>(`${this.basePath}/seed-demo`, {});
  }

  /** L16 — contribution anonymisée vers catalog_candidats (jamais d'article). */
  enrichissementContribuer(body: {
    libelle: string;
    nature?: string;
    uniteCode?: string;
    typeObjet?: string;
    proposePar?: string;
  }): Promise<CatalogCandidat> {
    return this.post<CatalogCandidat>(`${this.basePath}/enrichissement/contribuer`, body);
  }

  rapprochementMetrics(): Promise<{
    recherches: number;
    llmAppels: number;
    llmSkipsDeterministe: number;
    tauxAppelLlm: number;
  }> {
    return this.get(`${this.basePath}/rapprochement/metrics`);
  }

  /** L15 — pipeline déterministe (pas de LLM). */
  rapprochementSearch(body: {
    libelle: string;
    sourceType?: string;
    sourceId?: string;
    limit?: number;
    persister?: boolean;
  }): Promise<RapprochementCandidat[]> {
    return this.post<RapprochementCandidat[]>(`${this.basePath}/rapprochement/search`, body);
  }

  rapprochementValider(matchId: string): Promise<{ id: string; statut: string }> {
    return this.post<{ id: string; statut: string }>(
      `${this.basePath}/rapprochement/${matchId}/valider`,
      {},
    );
  }

  rapprochementRejeter(matchId: string): Promise<{ id: string; statut: string }> {
    return this.post<{ id: string; statut: string }>(
      `${this.basePath}/rapprochement/${matchId}/rejeter`,
      {},
    );
  }
}

export interface RapprochementCandidat {
  catalogCle: string;
  libelle: string;
  nature: string;
  uniteCode: string;
  methode: string;
  confiance: number;
  matchId?: string | null;
  statut?: string;
}
