/** Mode de chiffrage actif d’un article du bordereau. */
export type PosteChiffrageMode = 'FOURNI' | 'DECOMPOSE' | null;

/**
 * Résout le mode actif à partir du nœud DPGF.
 * Un prix unitaire > 0 sans mode explicite est traité comme prix fourni.
 * La présence de composants DPU n’influence pas ce mode (brouillon possible).
 */
export function resolvePosteChiffrageMode(opts: {
  mode?: string | null;
  prixUnitaire?: number | null;
}): PosteChiffrageMode {
  if (opts.mode === 'FOURNI' || opts.mode === 'DECOMPOSE') return opts.mode;
  if ((opts.prixUnitaire ?? 0) > 0) return 'FOURNI';
  return null;
}

/** Prix unitaire HT affiché selon le mode actif. */
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
