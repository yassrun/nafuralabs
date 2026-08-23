import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';
import type { LotChantier, NatureLigne } from '@app/chantiers/models';

interface ApiChantierLot {
  id: string;
  chantierId: string;
  code: string;
  parentLotId?: string;
  designation: string;
  nature: NatureLigne;
  dpgfNoeudId?: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  montantHt?: number;
  avancementPercent: number;
  ordre: number;
}

/**
 * Un poste envoye par l'import d'arbre. La saisie ne produit que de l'interne (AC-3) et un
 * interne ne porte pas de prix de vente (AC-4) : le prix n'est pas dans le contrat d'entree.
 */
export interface ChantierLotTreePosteInput {
  designation: string;
  unite?: string;
  quantite?: number;
}

export interface ChantierLotTreeNodeInput {
  designation: string;
  children?: ChantierLotTreeNodeInput[];
  postes?: ChantierLotTreePosteInput[];
}

export interface ChantierLotTreeRequest {
  lots: ChantierLotTreeNodeInput[];
}

export interface ChantierLotTreePosteNode {
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

export interface ChantierLotTreeNode {
  id: string;
  chantierId: string;
  code: string;
  designation: string;
  parentLotId?: string;
  nature: NatureLigne;
  dpgfNoeudId?: string;
  avancementPercent: number;
  ordre: number;
  depth: number;
  children: ChantierLotTreeNode[];
  postes: ChantierLotTreePosteNode[];
}

export interface ChantierLotTreeResponse {
  lots: ChantierLotTreeNode[];
}

function lotToUi(row: ApiChantierLot): LotChantier {
  return {
    id: row.id,
    chantierId: row.chantierId,
    code: row.code,
    parentLotId: row.parentLotId,
    designation: row.designation,
    nature: row.nature ?? 'INTERNE',
    dpgfNoeudId: row.dpgfNoeudId,
    unite: row.unite,
    quantite: row.quantite != null ? Number(row.quantite) : undefined,
    prixUnitaireHt: row.prixUnitaireHt != null ? Number(row.prixUnitaireHt) : undefined,
    montantHt: row.montantHt != null ? Number(row.montantHt) : undefined,
    avancementPercent: Number(row.avancementPercent ?? 0),
    ordre: row.ordre ?? 0,
  };
}

function treeNodeToUi(node: ChantierLotTreeNode): ChantierLotTreeNode {
  return {
    ...node,
    nature: node.nature ?? 'INTERNE',
    avancementPercent: Number(node.avancementPercent ?? 0),
    ordre: node.ordre ?? 0,
    depth: node.depth ?? 0,
    children: (node.children ?? []).map(treeNodeToUi),
    postes: (node.postes ?? []).map((poste) => ({
      ...poste,
      nature: poste.nature ?? 'INTERNE',
      quantite: poste.quantite != null ? Number(poste.quantite) : undefined,
      prixUnitaireHt: poste.prixUnitaireHt != null ? Number(poste.prixUnitaireHt) : undefined,
      montantHt: poste.montantHt != null ? Number(poste.montantHt) : undefined,
      ordre: poste.ordre ?? 0,
    })),
  };
}

@Injectable({ providedIn: 'root' })
export class ChantierLotApiService extends FeatureApiService<LotChantier, Partial<LotChantier>, Partial<LotChantier>> {
  protected override basePath = '/api/v1/chantiers';

  async listByChantier(chantierId: string): Promise<LotChantier[]> {
    const rows = await this.get<ApiChantierLot[]>(`${this.basePath}/${chantierId}/lots`);
    return (rows ?? []).map(lotToUi);
  }

  /**
   * Creation par saisie : le serveur produit une ligne interne (AC-3). Aucun prix de vente n'est
   * envoye — un montant vendu sur une ligne interne est refuse (AC-4).
   */
  async createForChantier(chantierId: string, data: Partial<LotChantier>): Promise<LotChantier> {
    const row = await this.post<ApiChantierLot>(`${this.basePath}/${chantierId}/lots`, {
      id: data.id,
      code: data.code,
      designation: data.designation,
      parentLotId: data.parentLotId,
      unite: data.unite,
      quantite: data.quantite,
      avancementPercent: data.avancementPercent ?? 0,
      ordre: data.ordre,
    });
    return lotToUi(row);
  }

  async createTree(chantierId: string, request: ChantierLotTreeRequest): Promise<ChantierLotTreeResponse> {
    const row = await this.post<ChantierLotTreeResponse>(`${this.basePath}/${chantierId}/lots/tree`, {
      lots: request.lots ?? [],
    });
    return {
      lots: (row?.lots ?? []).map(treeNodeToUi),
    };
  }

  /**
   * Edition : la nature et l'origine ne sont jamais reecrites (AC-2, AC-6), et un prix de vente
   * n'est envoye que sur une ligne vendue (AC-4).
   */
  async updateForChantier(chantierId: string, lotId: string, data: Partial<LotChantier>): Promise<LotChantier> {
    const vendu = data.nature === 'VENDU';
    const row = await this.put<ApiChantierLot>(`${this.basePath}/${chantierId}/lots/${lotId}`, {
      code: data.code,
      designation: data.designation,
      parentLotId: data.parentLotId,
      unite: data.unite,
      quantite: data.quantite,
      prixUnitaireHt: vendu ? data.prixUnitaireHt : undefined,
      montantHt: vendu ? data.montantHt : undefined,
      avancementPercent: data.avancementPercent,
      ordre: data.ordre,
    });
    return lotToUi(row);
  }

  async deleteForChantier(chantierId: string, lotId: string): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${chantierId}/lots/${lotId}`);
  }
}
