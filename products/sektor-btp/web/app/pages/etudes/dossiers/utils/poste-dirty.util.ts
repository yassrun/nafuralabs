/**
 * Helpers pour le dirty-state du panneau poste — évite de sérialiser les composants
 * à chaque frappe dans le commentaire.
 */

export function isCommentDirty(current: string, initial: string): boolean {
  return current.trim() !== initial.trim();
}

export function buildComposantDirtyKey(composants: Array<{
  id: string;
  type: string;
  libelle?: string;
  articleOuPosteId?: string;
  referenceType?: string;
  itemId?: string | null;
  ouvrageId?: string | null;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  sourcePrix?: string | null;
  offreFournisseurId?: string | null;
}>): string {
  return JSON.stringify(
    composants.map((c) => ({
      id: c.id,
      type: c.type,
      referenceType: c.referenceType ?? 'LIBRE',
      itemId: c.itemId ?? null,
      ouvrageId: c.ouvrageId ?? null,
      libelle: c.libelle ?? c.articleOuPosteId ?? '',
      quantite: c.quantite,
      unite: c.unite,
      prixUnitaire: c.prixUnitaire,
      sourcePrix: c.sourcePrix ?? 'MANUEL',
      offreFournisseurId: c.offreFournisseurId ?? null,
    })),
  );
}
