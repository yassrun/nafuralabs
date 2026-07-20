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

  /** Prévisualisation LLM sans persistance. */
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

  /** Persiste l'arbre validé dans le dialogue. */
  validerBordereau(
    dossierId: string,
    arbre: ImportNoeudPreview[],
    pieceId?: string,
  ): Promise<{ dpgfId: string; numero: string }> {
    const params = pieceId ? new HttpParams().set('pieceId', pieceId) : undefined;
    return firstValueFrom(
      this.http.post<{ dpgfId: string; numero: string }>(
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
