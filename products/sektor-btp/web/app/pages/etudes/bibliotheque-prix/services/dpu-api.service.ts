import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type {
  ComposantDPU,
  DpuHistoriqueEntry,
  PrixDPU,
} from '@app/etudes/models';

export type ComposantDpuWrite = {
  id?: string;
  type: ComposantDPU['type'];
  articleOuPosteId: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  total?: number;
  sourcePrix?: string | null;
  offreFournisseurId?: string | null;
};

export type PrixDpuUpdateBody = {
  fraisGenerauxPercent?: number;
  margeBeneficiairePercent?: number;
  tvaTaux?: number;
  composants?: ComposantDpuWrite[];
};

@Injectable({ providedIn: 'root' })
export class DpuApiService extends FeatureApiService<PrixDPU> {
  protected override basePath = '/api/v1/etudes/dpu';

  async listByOuvrage(ouvrageId: string): Promise<PrixDPU[]> {
    const params = new HttpParams().set('ouvrageId', ouvrageId);
    return this.get<PrixDPU[]>(this.basePath, params);
  }

  async listByNoeud(dpgfNoeudId: string): Promise<PrixDPU[]> {
    const params = new HttpParams().set('dpgfNoeudId', dpgfNoeudId);
    return this.get<PrixDPU[]>(this.basePath, params);
  }

  override async getById(id: string): Promise<PrixDPU> {
    return this.get<PrixDPU>(`${this.basePath}/${id}`);
  }

  async getOrCreateForNoeud(
    dpgfNoeudId: string,
    defaults?: { fraisGenerauxPercent?: number; margeBeneficiairePercent?: number; tvaTaux?: number },
  ): Promise<PrixDPU> {
    const existing = await this.listByNoeud(dpgfNoeudId);
    if (existing[0]) return existing[0];
    return firstValueFrom(
      this.http.post<PrixDPU>(this.resolveUrl(this.basePath), {
        dpgfNoeudId,
        ...defaults,
      }),
    );
  }

  override async update(id: string, body: PrixDpuUpdateBody): Promise<PrixDPU> {
    return firstValueFrom(
      this.http.put<PrixDPU>(this.resolveUrl(`${this.basePath}/${id}`), body),
    );
  }

  async getComposants(id: string): Promise<ComposantDPU[]> {
    return this.get<ComposantDPU[]>(`${this.basePath}/${id}/composants`);
  }

  async addComposant(id: string, body: Omit<ComposantDPU, 'id' | 'total'>): Promise<ComposantDPU> {
    return firstValueFrom(
      this.http.post<ComposantDPU>(this.resolveUrl(`${this.basePath}/${id}/composants`), body),
    );
  }

  async recompute(id: string): Promise<PrixDPU> {
    return firstValueFrom(
      this.http.post<PrixDPU>(this.resolveUrl(`${this.basePath}/${id}/recompute`), {}),
    );
  }

  async createVersion(id: string): Promise<DpuHistoriqueEntry> {
    return firstValueFrom(
      this.http.post<DpuHistoriqueEntry>(this.resolveUrl(`${this.basePath}/${id}/versions`), {}),
    );
  }

  async createForOuvrage(ouvrageId: string): Promise<PrixDPU> {
    return firstValueFrom(
      this.http.post<PrixDPU>(this.resolveUrl(this.basePath), { ouvrageId }),
    );
  }
}
