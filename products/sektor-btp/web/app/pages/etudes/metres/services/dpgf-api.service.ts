import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type { DPGF, NoeudDPGF } from '@app/etudes/models';

export interface DpgfLotTotal {
  code: string;
  libelle: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DpgfApiService extends FeatureApiService<DPGF> {
  protected override basePath = '/api/v1/etudes/dpgf';
  protected override searchFields = ['numero', 'projetNom'];

  async listByMetre(metreId: string): Promise<DPGF[]> {
    const params = new HttpParams().set('metreId', metreId);
    return this.get<DPGF[]>(this.basePath, params);
  }

  async getArbre(id: string): Promise<DPGF> {
    return this.get<DPGF>(`${this.basePath}/${id}/arbre`);
  }

  async addNoeud(
    dpgfId: string,
    body: {
      parentId?: string | null;
      type: string;
      code: string;
      libelle: string;
      quantite?: number | null;
      unite?: string | null;
    },
  ): Promise<NoeudDPGF> {
    return firstValueFrom(
      this.http.post<NoeudDPGF>(this.resolveUrl(`${this.basePath}/${dpgfId}/noeuds`), body),
    );
  }

  async updateNoeud(
    noeudId: string,
    body: Partial<{
      code: string;
      libelle: string;
      quantite: number | null;
      unite: string | null;
      prixUnitaire: number | null;
      prixFourniBase: number | null;
      fraisGenerauxPercent: number | null;
      margePercent: number | null;
      descriptif: string | null;
      mode: 'FOURNI' | 'DECOMPOSE';
    }>,
  ): Promise<NoeudDPGF> {
    return firstValueFrom(
      this.http.put<NoeudDPGF>(this.resolveUrl(`/api/v1/etudes/dpgf-noeuds/${noeudId}`), body),
    );
  }

  async deleteNoeud(noeudId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(this.resolveUrl(`/api/v1/etudes/dpgf-noeuds/${noeudId}`)),
    );
  }

  async createFromMetre(metreId: string, tvaTaux = 20): Promise<DPGF> {
    const params = new HttpParams()
      .set('fromMetreId', metreId)
      .set('tvaTaux', String(tvaTaux));
    return firstValueFrom(
      this.http.post<DPGF>(this.resolveUrl(this.basePath), {}, { params }),
    );
  }

  async getTotauxByLot(id: string): Promise<DpgfLotTotal[]> {
    return this.get<DpgfLotTotal[]>(`${this.basePath}/${id}/totaux`);
  }
}
