import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type {
  DossierDocument,
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate,
  DossierPieceAttendue,
  MarchePropose,
  ResultatGate,
  TypeDossierDocument,
} from '@app/etudes/models';
import type { ImportNoeudPreview } from '../utils/bordereau-tree.util';

export interface ExtractionJobDto {
  id: string;
  dossierEtudeId: string;
  dossierDocumentId: string;
  jobType: 'BORDEREAU_EXTRACT' | 'CPS_INDEX' | string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | string;
  progressPercent: number;
  progressStep?: string | null;
  result?: {
    arbre?: ImportNoeudPreview[];
    articleCount?: number;
    pieceId?: string;
    fileName?: string;
    outcome?: string;
    cpsDocumentId?: string;
    statutExtraction?: string;
    nbSections?: number;
  } | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  attemptCount: number;
  maxAttempts: number;
  createdAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface ValiderBordereauResult {
  dpgfId: string;
  numero: string;
  articlesAcceptes: number;
  articlesIgnores: number;
}

/** Suggestion Gemini depuis les sections CPS (jamais persistée automatiquement). */
export interface DescriptifPropose {
  texte: string;
  sectionSourceId?: string | null;
  confiance: number;
}

export interface DecompositionComposantMatched {
  type: string;
  /** Vide / absent pour un composant manuel (hors catalogue). */
  itemId?: string;
  code?: string;
  name: string;
  unite: string;
  rendement: number;
  prixUnitaire: number;
  sourcePrix: string;
  confiance?: number;
  suggereParIa?: boolean;
}

export interface DecompositionComposantMissing {
  type: string;
  designation: string;
  unite: string;
  rendement: number;
  confiance?: number;
  raison?: string;
}

/** Suggestion de décomposition (matched catalogue + missing à créer). */
export interface DecompositionPropose {
  matched: DecompositionComposantMatched[];
  missing: DecompositionComposantMissing[];
  confiance?: number;
}

/** Synthèse agrégée pour l'entête du dossier. */
export interface DossierEtudeSynthese {
  id: string;
  numero: string;
  objet: string;
  clientId?: string | null;
  clientNom?: string | null;
  appelOffreClientId?: string | null;
  status: string;
  currentStep: number;
  phase: string;
  validationEtape?: string | null;
  bordereauRevision: number;
  structureVerrouillee: boolean;
  modifiable: boolean;
  nombreArticles: number;
  anomaliesBloquantes: number;
  totalHt: number;
  devisGenereId?: string | null;
  devisNumero?: string | null;
  approvalRequestId?: string | null;
  prochainApprobateurRole?: string | null;
  prochainApprobateurNom?: string | null;
  motifRefus?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  gates: ResultatGate[];
  actionPrincipale: string;
}

@Injectable({ providedIn: 'root' })
export class DossierEtudeApiService extends FeatureApiService<
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate
> {
  protected override basePath = '/api/v1/etudes/dossiers';
  protected override searchFields = ['numero', 'objet', 'clientNom'];

  /**
   * État des cinq gates, sans transition.
   *
   * Le front ne rejoue jamais les règles : il les lit ici. C'est ce qui empêche la logique de
   * gate de diverger entre les deux côtés, comme c'était le cas dans le module supprimé.
   */
  gates(id: string): Promise<ResultatGate[]> {
    return this.get<ResultatGate[]>(`${this.basePath}/${id}/gates`);
  }

  allerAEtape(id: string, etape: number): Promise<DossierEtude> {
    return this.put<DossierEtude>(`${this.basePath}/${id}/etape`, { etape });
  }

  soumettre(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'soumettre');
  }

  valider(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'valider');
  }

  refuser(id: string, motif: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'refuser', { motif });
  }

  annuler(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'annuler');
  }

  synthese(id: string): Promise<DossierEtudeSynthese> {
    return this.get<DossierEtudeSynthese>(`${this.basePath}/${id}/synthese`);
  }

  reouvrirBordereau(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'reouvrir-bordereau');
  }

  genererDevis(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'generer-devis');
  }

  listerDocuments(dossierId: string): Promise<DossierDocument[]> {
    return this.get<DossierDocument[]>(`${this.basePath}/${dossierId}/documents`);
  }

  deposerDocument(
    dossierId: string,
    file: File,
    type: TypeDossierDocument,
  ): Promise<DossierDocument> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('type', type);
    return firstValueFrom(
      this.http.post<DossierDocument>(
        this.resolveUrl(`${this.basePath}/${dossierId}/documents`),
        form,
      ),
    );
  }

  /** Démarre l'extraction bordereau en job asynchrone (202 Accepted). */
  demarrerExtractionBordereau(
    dossierId: string,
    pieceId: string,
  ): Promise<ExtractionJobDto> {
    return firstValueFrom(
      this.http.post<ExtractionJobDto>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/documents/${pieceId}/extraire-bordereau-async`,
        ),
        {},
      ),
    );
  }

  statutExtractionJob(dossierId: string, jobId: string): Promise<ExtractionJobDto> {
    return this.get<ExtractionJobDto>(
      `${this.basePath}/${dossierId}/documents/extraction-jobs/${jobId}`,
    );
  }

  relancerExtractionJob(dossierId: string, jobId: string): Promise<ExtractionJobDto> {
    return firstValueFrom(
      this.http.post<ExtractionJobDto>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/documents/extraction-jobs/${jobId}/relancer`,
        ),
        {},
      ),
    );
  }

  /** Prévisualisation LLM synchrone (compat). Préférer demarrerExtractionBordereau. */
  previsualiserBordereau(
    dossierId: string,
    pieceId: string,
  ): Promise<{ arbre: ImportNoeudPreview[]; articleCount: number; pieceId: string }> {
    return firstValueFrom(
      this.http.post<{ arbre: ImportNoeudPreview[]; articleCount: number; pieceId: string }>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/documents/${pieceId}/previsualiser-bordereau`,
        ),
        {},
      ),
    );
  }

  /** Persiste l'arbre revu inline (remplace le DPGF existant si confirmReplace). */
  validerBordereau(
    dossierId: string,
    arbre: ImportNoeudPreview[],
    pieceId?: string,
    confirmReplace = false,
  ): Promise<ValiderBordereauResult> {
    let params = new HttpParams().set('confirmReplace', String(confirmReplace));
    if (pieceId) {
      params = params.set('pieceId', pieceId);
    }
    return firstValueFrom(
      this.http.post<ValiderBordereauResult>(
        this.resolveUrl(`${this.basePath}/${dossierId}/documents/valider-bordereau`),
        { arbre },
        { params },
      ),
    );
  }

  /** Étape 2 mode auto — extraction + persistance immédiate (compat). */
  extraireBordereau(dossierId: string, pieceId?: string): Promise<{ dpgfId: string; numero: string }> {
    const path = pieceId
      ? `${this.basePath}/${dossierId}/documents/${pieceId}/extraire-bordereau`
      : `${this.basePath}/${dossierId}/documents/extraire-bordereau`;
    return firstValueFrom(
      this.http.post<{ dpgfId: string; numero: string }>(this.resolveUrl(path), {}),
    );
  }

  /** Étape 2 mode manuel — DPGF vide rattaché au dossier. */
  initBordereauManuel(dossierId: string): Promise<{ dpgfId: string; numero: string }> {
    return firstValueFrom(
      this.http.post<{ dpgfId: string; numero: string }>(
        this.resolveUrl(`${this.basePath}/${dossierId}/documents/init-bordereau-manuel`),
        {},
      ),
    );
  }

  supprimerDocument(dossierId: string, documentId: string): Promise<void> {
    return this.deleteRequest(`${this.basePath}/${dossierId}/documents/${documentId}`);
  }

  /**
   * Propose un descriptif technique pour un article à partir du CPS indexé (Gemini).
   * Retourne `null` si aucune section pertinente (HTTP 204).
   */
  proposerDescriptif(
    dossierId: string,
    cpsDocumentId: string,
    articleId: string,
  ): Promise<DescriptifPropose | null> {
    const params = new HttpParams().set('articleId', articleId);
    return firstValueFrom(
      this.http.post<DescriptifPropose | null>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/documents/cps/${cpsDocumentId}/descriptif-propose`,
        ),
        {},
        { params },
      ),
    );
  }

  /** Bookmark legacy AOC → dossier lié (404 → null). */
  async findByAppelOffreClientId(appelOffreClientId: string): Promise<DossierEtude | null> {
    try {
      return await this.get<DossierEtude>(
        this.basePath,
        new HttpParams().set('appelOffreClientId', appelOffreClientId),
      );
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 404) return null;
      throw e;
    }
  }

  listerPiecesAttendues(dossierId: string): Promise<DossierPieceAttendue[]> {
    return this.get<DossierPieceAttendue[]>(`${this.basePath}/${dossierId}/pieces-attendues`);
  }

  creerPieceAttendue(
    dossierId: string,
    body: { type: string; libelle: string; obligatoire?: boolean },
  ): Promise<DossierPieceAttendue> {
    return this.post<DossierPieceAttendue>(`${this.basePath}/${dossierId}/pieces-attendues`, body);
  }

  updatePieceAttendue(
    dossierId: string,
    pieceId: string,
    body: { libelle?: string; obligatoire?: boolean },
  ): Promise<DossierPieceAttendue> {
    return firstValueFrom(
      this.http.patch<DossierPieceAttendue>(
        this.resolveUrl(`${this.basePath}/${dossierId}/pieces-attendues/${pieceId}`),
        body,
      ),
    );
  }

  supprimerPieceAttendue(dossierId: string, pieceId: string): Promise<void> {
    return this.deleteRequest(`${this.basePath}/${dossierId}/pieces-attendues/${pieceId}`);
  }

  lierPieceAttendue(
    dossierId: string,
    pieceId: string,
    dossierDocumentId: string,
  ): Promise<DossierPieceAttendue> {
    return this.post<DossierPieceAttendue>(
      `${this.basePath}/${dossierId}/pieces-attendues/${pieceId}/lier`,
      { dossierDocumentId },
    );
  }

  /**
   * Métadonnées + checklist depuis CPS indexé. `null` si 204 (fallback manuel).
   * `cpsDocumentId` = id de la pièce DossierDocument CPS.
   */
  async proposerMarche(
    dossierId: string,
    cpsDocumentId: string,
  ): Promise<MarchePropose | null> {
    try {
      return await firstValueFrom(
        this.http.post<MarchePropose>(
          this.resolveUrl(
            `${this.basePath}/${dossierId}/documents/cps/${cpsDocumentId}/proposer-marche`,
          ),
          {},
        ),
      );
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 204) return null;
      throw e;
    }
  }

  appliquerPropositionMarche(
    dossierId: string,
    body: {
      metadonnees?: MarchePropose['metadonnees'];
      piecesAttendues?: MarchePropose['piecesAttendues'];
    },
  ): Promise<DossierEtude> {
    return this.post<DossierEtude>(
      `${this.basePath}/${dossierId}/pieces-attendues/appliquer-proposition`,
      body,
    );
  }

  /**
   * Propose une décomposition brouillon (catalogue + absents). Jamais persistée.
   * Retourne `null` si aucun besoin exploitable (HTTP 204).
   */
  proposerDecomposition(
    dossierId: string,
    articleId: string,
    cpsDocumentId?: string | null,
  ): Promise<DecompositionPropose | null> {
    let params = new HttpParams();
    if (cpsDocumentId) {
      params = params.set('cpsDocumentId', cpsDocumentId);
    }
    return firstValueFrom(
      this.http.post<DecompositionPropose | null>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/articles/${articleId}/decomposition-propose`,
        ),
        {},
        { params },
      ),
    );
  }
}
