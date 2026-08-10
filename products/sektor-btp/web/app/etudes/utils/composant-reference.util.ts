import type { ComposantDPU, ReferenceTypeComposant } from '@app/etudes/models';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Libellé d'affichage — indépendant de la résolution catalogue. */
export function composantLibelle(c: Pick<ComposantDPU, 'libelle' | 'articleOuPosteId'>): string {
  return String(c.libelle ?? c.articleOuPosteId ?? '').trim();
}

/** Affichage source gelée (L5) — sinon libellé composant. */
export function composantPrixSourceLabel(c: Pick<ComposantDPU, 'prixLibelleSource' | 'sourcePrix'>): string | null {
  const gel = String(c.prixLibelleSource ?? '').trim();
  if (gel) return gel;
  if (c.sourcePrix && c.sourcePrix !== 'MANUEL') return String(c.sourcePrix);
  return null;
}

export function estComposantItem(c: Pick<ComposantDPU, 'referenceType' | 'itemId' | 'articleOuPosteId'>): boolean {
  if (c.referenceType === 'ITEM' && c.itemId) return true;
  if (!c.referenceType && c.articleOuPosteId && UUID_RE.test(c.articleOuPosteId)) return true;
  return false;
}

/** Normalise une ligne API (legacy ou L2/L5) vers le contrat typé. */
export function normalizeComposantDpu(
  c: Partial<ComposantDPU> & { rendement?: number },
  fallbackId?: string,
): ComposantDPU {
  const libelle = composantLibelle(c as ComposantDPU) || 'Sans libellé';
  let referenceType: ReferenceTypeComposant = (c.referenceType as ReferenceTypeComposant) || 'LIBRE';
  let itemId = c.itemId ?? null;
  let ouvrageId = c.ouvrageId ?? null;

  if (!c.referenceType && c.articleOuPosteId && UUID_RE.test(c.articleOuPosteId)) {
    referenceType = 'ITEM';
    itemId = c.articleOuPosteId;
  } else if (!c.referenceType) {
    referenceType = 'LIBRE';
    itemId = null;
    ouvrageId = null;
  }

  if (referenceType === 'ITEM') {
    ouvrageId = null;
  } else if (referenceType === 'OUVRAGE') {
    itemId = null;
  } else {
    itemId = null;
    ouvrageId = null;
  }

  return {
    id: c.id || fallbackId || crypto.randomUUID(),
    type: (c.type as ComposantDPU['type']) || 'MATIERE',
    referenceType,
    itemId,
    ouvrageId,
    libelle,
    articleOuPosteId: libelle,
    quantite: Number(c.quantite ?? c.rendement ?? 0),
    unite: c.unite || 'U',
    prixUnitaire: Number(c.prixUnitaire ?? 0),
    total: Number(c.total ?? 0),
    sourcePrix: c.sourcePrix ?? 'MANUEL',
    offreFournisseurId: c.offreFournisseurId ?? null,
    prixSourceRefId: c.prixSourceRefId ?? null,
    prixDateSource: c.prixDateSource ?? null,
    prixCurrencyId: c.prixCurrencyId ?? null,
    prixLibelleSource: c.prixLibelleSource ?? null,
  };
}

export function toComposantDpuWrite(c: ComposantDPU): {
  id?: string;
  type: ComposantDPU['type'];
  referenceType: ReferenceTypeComposant;
  itemId?: string | null;
  ouvrageId?: string | null;
  libelle: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  total?: number;
  sourcePrix?: string | null;
  offreFournisseurId?: string | null;
  prixSourceRefId?: string | null;
  prixDateSource?: string | null;
  prixCurrencyId?: string | null;
  prixLibelleSource?: string | null;
} {
  const n = normalizeComposantDpu(c);
  return {
    id: n.id,
    type: n.type,
    referenceType: n.referenceType,
    itemId: n.itemId,
    ouvrageId: n.ouvrageId,
    libelle: n.libelle,
    quantite: n.quantite,
    unite: n.unite,
    prixUnitaire: n.prixUnitaire,
    total: n.total,
    sourcePrix: n.sourcePrix ?? 'MANUEL',
    offreFournisseurId: n.offreFournisseurId ?? null,
    prixSourceRefId: n.prixSourceRefId ?? null,
    prixDateSource: n.prixDateSource ?? null,
    prixCurrencyId: n.prixCurrencyId ?? null,
    prixLibelleSource: n.prixLibelleSource ?? null,
  };
}
