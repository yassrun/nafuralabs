import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type {
  DossierDocument,
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate,
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

  /** Persiste l'arbre revu inline (remplace le DPGF existant). */
  validerBordereau(
    dossierId: string,
    arbre: ImportNoeudPreview[],
    pieceId?: string,
  ): Promise<ValiderBordereauResult> {
    const params = pieceId ? new HttpParams().set('pieceId', pieceId) : undefined;
    return firstValueFrom(
      this.http.post<ValiderBordereauResult>(
        this.resolveUrl(`${this.basePath}/${dossierId}/documents/valider-bordereau`),
        { arbre },
        params ? { params } : {},
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
}
