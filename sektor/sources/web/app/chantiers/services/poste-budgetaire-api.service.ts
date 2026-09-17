import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';
import type { NatureLigne, PosteBudgetaire } from '@app/chantiers/models';

interface ApiPosteBudgetaire {
  id: string;
  lotId: string;
  code: string;
  designation: string;
  nature: NatureLigne;
  dpgfNoeudId?: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  montantHt?: number;
  ordre: number;
}

function posteToUi(row: ApiPosteBudgetaire): PosteBudgetaire {
  return {
    id: row.id,
    lotId: row.lotId,
    code: row.code,
    designation: row.designation,
    nature: row.nature ?? 'INTERNE',
    dpgfNoeudId: row.dpgfNoeudId,
    unite: row.unite,
    quantite: row.quantite != null ? Number(row.quantite) : undefined,
    prixUnitaireHt: row.prixUnitaireHt != null ? Number(row.prixUnitaireHt) : undefined,
    montantHt: row.montantHt != null ? Number(row.montantHt) : undefined,
    ordre: row.ordre ?? 0,
  };
}

@Injectable({ providedIn: 'root' })
export class PosteBudgetaireApiService extends FeatureApiService<
  PosteBudgetaire,
  Partial<PosteBudgetaire>,
  Partial<PosteBudgetaire>
> {
  protected override basePath = '/api/v1/lots';

  async listByLot(lotId: string): Promise<PosteBudgetaire[]> {
    const rows = await this.get<ApiPosteBudgetaire[]>(`${this.basePath}/${lotId}/postes-budgetaires`);
    return (rows ?? []).map(posteToUi);
  }

  /**
   * Creation par saisie : le serveur produit un poste interne (AC-3). Aucun prix de vente n'est
   * envoye — un montant vendu sur une ligne interne est refuse (AC-4).
   */
  async createForLot(lotId: string, data: Partial<PosteBudgetaire>): Promise<PosteBudgetaire> {
    const row = await this.post<ApiPosteBudgetaire>(`${this.basePath}/${lotId}/postes-budgetaires`, {
      id: data.id,
      code: data.code,
      designation: data.designation,
      unite: data.unite,
      quantite: data.quantite,
      ordre: data.ordre,
    });
    return posteToUi(row);
  }

  /**
   * Edition : la nature et l'origine ne sont jamais reecrites (AC-2, AC-6), et un prix de vente
   * n'est envoye que sur un poste vendu (AC-4).
   */
  async updatePoste(posteId: string, data: Partial<PosteBudgetaire>): Promise<PosteBudgetaire> {
    const vendu = data.nature === 'VENDU';
    const row = await this.put<ApiPosteBudgetaire>(`/api/v1/postes-budgetaires/${posteId}`, {
      code: data.code,
      designation: data.designation,
      unite: data.unite,
      quantite: data.quantite,
      prixUnitaireHt: vendu ? data.prixUnitaireHt : undefined,
      montantHt: vendu ? data.montantHt : undefined,
      ordre: data.ordre,
    });
    return posteToUi(row);
  }

  async deletePoste(posteId: string): Promise<void> {
    await this.deleteRequest(`/api/v1/postes-budgetaires/${posteId}`);
  }

  /**
   * Ajoute une ligne au BDP chiffré du chantier. C'est la seule voie d'écriture d'une ligne
   * vendue hors copie du devis : la saisie générique d'arbre, elle, ne produit que de l'interne.
   */
  async createLigneBdp(
    chantierId: string,
    data: { lotId: string; designation: string; code?: string; unite?: string; quantite?: number; prixUnitaireHt?: number; montantHt?: number; ordre?: number },
  ): Promise<PosteBudgetaire> {
    const vendu = data.prixUnitaireHt != null || data.montantHt != null;
    const row = await this.post<ApiPosteBudgetaire>(`/api/v1/chantiers/${chantierId}/bdp/lignes`, {
      ...data,
      nature: vendu ? 'VENDU' : 'INTERNE',
    });
    return posteToUi(row);
  }

  /**
   * Corrige une ligne du BDP : quantité, prix unitaire et nature. Une ligne vendue sans quantité
   * ni prix est refusée par le serveur, jamais dégradée en silence.
   */
  async updateLigneBdp(
    chantierId: string,
    posteId: string,
    data: { designation?: string; unite?: string; quantite?: number; prixUnitaireHt?: number; montantHt?: number; nature?: NatureLigne },
  ): Promise<PosteBudgetaire> {
    const row = await this.put<ApiPosteBudgetaire>(`/api/v1/chantiers/${chantierId}/bdp/lignes/${posteId}`, data);
    return posteToUi(row);
  }
}
