import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type {
  CatalogCandidate,
  ComposantInput,
  Consultation,
  ConsultationComposant,
  ConsultationCreate,
  ConsultationNoeud,
  ConsultationUpdate,
  CreateItem,
  LinkItem,
  NoeudCreate,
  NoeudUpdate,
  PosteMode,
  PostePricing,
} from '../models';

const CONSULTATION_ROOT = '/api/v1/consultation';

@Injectable({ providedIn: 'root' })
export class ConsultationApiService extends FeatureApiService<
  Consultation,
  ConsultationCreate,
  ConsultationUpdate
> {
  protected override basePath = `${CONSULTATION_ROOT}/consultations`;
  protected override searchFields = ['numero', 'objet', 'chantierName'];

  async setStep(id: string, step: number): Promise<Consultation> {
    return this.put<Consultation>(`${this.basePath}/${id}/step`, { step });
  }

  async submitForValidation(id: string): Promise<Consultation> {
    return this.post<Consultation>(`${this.basePath}/${id}/submit-for-validation`, {});
  }

  /** Legacy AI extract — kept for unused dialog compile safety; not wired in wizard UI. */
  async importTree(id: string, tree: { arbre: unknown[] }): Promise<Consultation> {
    return this.post<Consultation>(`${this.basePath}/${id}/import-tree`, tree);
  }

  async extract(id: string, file: File): Promise<Consultation> {
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(
      this.http.post<Consultation>(this.resolveUrl(`${this.basePath}/${id}/extract`), formData),
    );
  }

  async extractDescriptifs(
    id: string,
    file: File,
  ): Promise<{ consultation: Consultation; postesTotal: number; matched: number; unmatchedCodes: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(
      this.http.post<{
        consultation: Consultation;
        postesTotal: number;
        matched: number;
        unmatchedCodes: string[];
      }>(this.resolveUrl(`${this.basePath}/${id}/extract-descriptifs`), formData),
    );
  }

  async validate(id: string): Promise<Consultation> {
    return this.post<Consultation>(`${this.basePath}/${id}/validate`, {});
  }

  async createNoeud(consultationId: string, body: NoeudCreate): Promise<ConsultationNoeud> {
    return this.post<ConsultationNoeud>(`${this.basePath}/${consultationId}/noeuds`, body);
  }

  async updateNoeud(noeudId: string, body: NoeudUpdate): Promise<ConsultationNoeud> {
    return this.put<ConsultationNoeud>(`${CONSULTATION_ROOT}/noeuds/${noeudId}`, body);
  }

  async deleteNoeud(noeudId: string): Promise<void> {
    return this.deleteRequest(`${CONSULTATION_ROOT}/noeuds/${noeudId}`);
  }

  async setMode(noeudId: string, mode: PosteMode): Promise<ConsultationNoeud> {
    return this.put<ConsultationNoeud>(`${CONSULTATION_ROOT}/noeuds/${noeudId}/mode`, { mode });
  }

  async updateDescriptif(noeudId: string, descriptif: string): Promise<ConsultationNoeud> {
    return this.put<ConsultationNoeud>(`${CONSULTATION_ROOT}/noeuds/${noeudId}/descriptif`, {
      descriptif,
    });
  }

  async updatePricing(noeudId: string, body: PostePricing): Promise<ConsultationNoeud> {
    return this.put<ConsultationNoeud>(`${CONSULTATION_ROOT}/noeuds/${noeudId}/pricing`, body);
  }

  async addComposant(noeudId: string, input: ComposantInput): Promise<ConsultationComposant> {
    return this.post<ConsultationComposant>(
      `${CONSULTATION_ROOT}/noeuds/${noeudId}/composants`,
      input,
    );
  }

  async updateComposant(
    composantId: string,
    input: ComposantInput,
  ): Promise<ConsultationComposant> {
    return this.put<ConsultationComposant>(
      `${CONSULTATION_ROOT}/composants/${composantId}`,
      input,
    );
  }

  async deleteComposant(composantId: string): Promise<void> {
    return this.deleteRequest(`${CONSULTATION_ROOT}/composants/${composantId}`);
  }

  async candidates(q: string, type?: string, limit = 10): Promise<CatalogCandidate[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (q) params = params.set('q', q);
    if (type) params = params.set('type', type);
    return firstValueFrom(
      this.http.get<CatalogCandidate[]>(
        this.resolveUrl(`${CONSULTATION_ROOT}/catalog/candidates`),
        { params },
      ),
    );
  }

  async linkNoeud(noeudId: string, body: LinkItem): Promise<ConsultationNoeud> {
    return this.post<ConsultationNoeud>(`${CONSULTATION_ROOT}/noeuds/${noeudId}/link-item`, body);
  }

  async createItemForNoeud(noeudId: string, body: CreateItem): Promise<ConsultationNoeud> {
    return this.post<ConsultationNoeud>(`${CONSULTATION_ROOT}/noeuds/${noeudId}/create-item`, body);
  }

  async linkComposant(composantId: string, body: LinkItem): Promise<ConsultationComposant> {
    return this.post<ConsultationComposant>(
      `${CONSULTATION_ROOT}/composants/${composantId}/link-item`,
      body,
    );
  }

  async createItemForComposant(
    composantId: string,
    body: CreateItem,
  ): Promise<ConsultationComposant> {
    return this.post<ConsultationComposant>(
      `${CONSULTATION_ROOT}/composants/${composantId}/create-item`,
      body,
    );
  }
}
