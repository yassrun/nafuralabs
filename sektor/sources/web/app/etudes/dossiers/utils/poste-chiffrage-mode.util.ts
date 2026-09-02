/** Origine du coût d'un article (L6 — remplace FOURNI | DECOMPOSE). */
export type OrigineCoutUi = 'DECOMPOSE' | 'FORFAIT' | 'ESTIME';

export type EstimationSaisieEnUi = 'COUT' | 'VENTE';

/** @deprecated alias legacy — préférer OrigineCoutUi */
export type PosteChiffrageMode = 'FOURNI' | 'DECOMPOSE' | null;
/** @deprecated alias — FOURNI = ESTIME|FORFAIT */
export type PosteChiffrageModeUi = 'FOURNI' | 'DECOMPOSE';

export function resolveOrigineCout(opts: {
  origineCout?: string | null;
  mode?: string | null;
  prixUnitaire?: number | null;
}): OrigineCoutUi | null {
  const o = opts.origineCout?.toUpperCase();
  if (o === 'DECOMPOSE' || o === 'FORFAIT' || o === 'ESTIME') return o;
  if (opts.mode === 'DECOMPOSE') return 'DECOMPOSE';
  if (opts.mode === 'FOURNI') return 'ESTIME';
  if ((opts.prixUnitaire ?? 0) > 0) return 'ESTIME';
  return null;
}

/** Origine affichée : null persisté → DECOMPOSE (défaut UX). */
export function origineUi(origine: OrigineCoutUi | null): OrigineCoutUi {
  return origine ?? 'DECOMPOSE';
}

/**
 * Résout le mode actif à partir du nœud DPGF (compat).
 * @deprecated prefer resolveOrigineCout
 */
export function resolvePosteChiffrageMode(opts: {
  mode?: string | null;
  origineCout?: string | null;
  prixUnitaire?: number | null;
}): PosteChiffrageMode {
  const o = resolveOrigineCout(opts);
  if (o === 'DECOMPOSE') return 'DECOMPOSE';
  if (o === 'ESTIME' || o === 'FORFAIT') return 'FOURNI';
  return null;
}

/** @deprecated prefer origineUi */
export function modeUi(mode: PosteChiffrageMode): PosteChiffrageModeUi {
  return mode ?? 'DECOMPOSE';
}

export function prixVenteHtActif(opts: {
  mode?: PosteChiffrageMode;
  origine?: OrigineCoutUi | null;
  prixFourni?: number | null;
  prixDecompose?: number | null;
  prixPoste?: number | null;
}): number {
  const origine =
    opts.origine ??
    (opts.mode === 'FOURNI' ? 'ESTIME' : opts.mode === 'DECOMPOSE' ? 'DECOMPOSE' : null);
  if (origine === 'ESTIME' || origine === 'FORFAIT') {
    return Math.max(0, Number(opts.prixFourni ?? opts.prixPoste ?? 0));
  }
  if (origine === 'DECOMPOSE') {
    return Math.max(0, Number(opts.prixDecompose ?? 0));
  }
  return Math.max(0, Number(opts.prixPoste ?? opts.prixFourni ?? 0));
}

/** Coût de revient = coût × (1 + FG%). */
export function computeCoutRevient(cout: number, fgPercent: number): number {
  return round2(Math.max(0, cout) * (1 + Math.max(0, fgPercent) / 100));
}

/** Prix vente multiplicatif : coût → revient → vente (ESTIME / FORFAIT). */
export function computePrixVenteDepuisCout(
  cout: number,
  fgPercent: number,
  margePercent: number,
): number {
  const revient = computeCoutRevient(cout, fgPercent);
  return round2(revient * (1 + Math.max(0, margePercent) / 100));
}

export function deduceCoutDepuisPrixVente(
  prix: number,
  fgPercent: number,
  margePercent: number,
): number {
  const coef =
    (1 + Math.max(0, fgPercent) / 100) * (1 + Math.max(0, margePercent) / 100);
  if (coef <= 0) return round2(Math.max(0, prix));
  return round2(Math.max(0, prix) / coef);
}

/** Écart % décomposition vs estimation repère (négatif = moins cher). */
export function ecartEstimationPercent(repere: number, decompo: number): number | null {
  if (!Number.isFinite(repere) || repere <= 0) return null;
  return round2(((decompo - repere) / repere) * 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Prix de vente HT d’une saisie simple, ou null si rien n’est encore chiffré. */
export function puVenteSimple(opts: {
  cout: number | null | undefined;
  fgPercent: number;
  margePercent: number;
  venteDirecte?: number | null;
}): number | null {
  const vente = opts.venteDirecte;
  if (vente != null && Number.isFinite(vente) && vente > 0) return round2(vente);
  const cout = opts.cout;
  if (cout == null || !Number.isFinite(cout) || cout <= 0) return null;
  return computePrixVenteDepuisCout(cout, opts.fgPercent, opts.margePercent);
}
