import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@platform/lib/anatomy';
import type { DPGF, NoeudDPGF } from '@app/etudes/models';

/**
 * AC-2 / AC-16 — le poste du devis d'origine d'une ligne vendue du chantier, retrouvé depuis le
 * seul identifiant que cette ligne conserve.
 */
export interface PosteOrigine {
  posteId: string;
  code: string;
  libelle: string;
  type: string;
  dpgfId?: string | null;
  dossierId?: string | null;
  dossierNumero?: string | null;
  dossierObjet?: string | null;
}

export interface DpgfLotTotal {
  code: string;
  libelle: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DpgfApiService extends FeatureApiService<DPGF> {
  protected override basePath = '/api/v1/etudes/dpgf';
  protected override searchFields = ['numero', 'projetNom'];

  /** AC-2 / AC-16 — remonter d'une ligne vendue au poste du devis dont elle a été copiée. */
  async origineDuPoste(noeudId: string): Promise<PosteOrigine> {
    return this.get<PosteOrigine>(`${this.basePath}/noeuds/${noeudId}/origine`);
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
      coutUnitaire: number | null;
      /** @deprecated */
      prixFourniBase: number | null;
      fraisGenerauxPercent: number | null;
      margePercent: number | null;
      descriptif: string | null;
      origineCout: 'DECOMPOSE' | 'FORFAIT' | 'ESTIME';
      estimationSaisieEn?: 'COUT' | 'VENTE';
      forfaitPartnerId?: string | null;
      forfaitOffreId?: string | null;
      /** @deprecated */
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

  async getTotauxByLot(id: string): Promise<DpgfLotTotal[]> {
    return this.get<DpgfLotTotal[]>(`${this.basePath}/${id}/totaux`);
  }
}
