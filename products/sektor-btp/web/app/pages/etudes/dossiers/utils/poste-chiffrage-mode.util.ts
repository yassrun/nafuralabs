/** Origine du coût d'un article (L1 — FOURNI disparaît). */
export type OrigineCoutUi = 'DECOMPOSE' | 'FORFAIT' | 'ESTIME';

/** @deprecated alias legacy */
export type PosteChiffrageMode = 'FOURNI' | 'DECOMPOSE' | null;
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

export function modeUi(mode: PosteChiffrageMode): PosteChiffrageModeUi {
  return mode ?? 'DECOMPOSE';
}

export function prixVenteHtActif(opts: {
  mode: PosteChiffrageMode;
  prixFourni?: number | null;
  prixDecompose?: number | null;
  prixPoste?: number | null;
}): number {
  if (opts.mode === 'FOURNI') {
    return Math.max(0, Number(opts.prixFourni ?? opts.prixPoste ?? 0));
  }
  if (opts.mode === 'DECOMPOSE') {
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
  const coef = (1 + Math.max(0, fgPercent) / 100) * (1 + Math.max(0, margePercent) / 100);
  if (coef <= 0) return round2(Math.max(0, prix));
  return round2(Math.max(0, prix) / coef);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
