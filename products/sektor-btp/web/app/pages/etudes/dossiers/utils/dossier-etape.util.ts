/**
 * Mapping entre étapes métier UI (4) et étapes techniques backend (5).
 *
 * Backend conserve 1..5 pour éviter une migration des dossiers existants.
 * UI : Documents → Bordereau → Décomposition & consultations → Synthèse.
 * Correspondance : 1→1, 2→2, 3|4→3, 5→4.
 */

export const ETAPES_UI_DOSSIER = [
  { ui: 1, libelle: 'Documents du marché', nextLabel: 'Continuer vers le bordereau' },
  { ui: 2, libelle: 'Bordereau', nextLabel: 'Continuer vers la décomposition' },
  {
    ui: 3,
    libelle: 'Décomposition et consultations',
    nextLabel: 'Voir la synthèse',
  },
  {
    ui: 4,
    libelle: 'Synthèse et validation',
    nextLabel: 'Soumettre à validation',
  },
] as const;

/** Étapes backend techniques (numéros persistés dans `currentStep`). */
export const BACKEND_ETAPE = {
  DOCUMENTS: 1,
  BORDEREAU: 2,
  DECOMPOSITION: 3,
  CONSULTATION: 4,
  CHIFFRAGE: 5,
} as const;

export function backendToUiEtape(backendStep: number): number {
  if (backendStep <= 1) return 1;
  if (backendStep === 2) return 2;
  if (backendStep === 3 || backendStep === 4) return 3;
  return 4;
}

/** Étape backend cible quand on affiche / quitte une étape UI. */
export function uiToBackendEtape(uiStep: number): number {
  if (uiStep <= 1) return BACKEND_ETAPE.DOCUMENTS;
  if (uiStep === 2) return BACKEND_ETAPE.BORDEREAU;
  if (uiStep === 3) return BACKEND_ETAPE.DECOMPOSITION;
  return BACKEND_ETAPE.CHIFFRAGE;
}

/** Prochaine étape backend depuis l'étape UI courante. */
export function nextBackendEtape(uiStep: number): number | null {
  if (uiStep === 1) return BACKEND_ETAPE.BORDEREAU;
  if (uiStep === 2) return BACKEND_ETAPE.DECOMPOSITION;
  if (uiStep === 3) return BACKEND_ETAPE.CHIFFRAGE;
  return null;
}

/** Étape backend précédente depuis l'étape UI courante. */
export function prevBackendEtape(uiStep: number): number | null {
  if (uiStep === 2) return BACKEND_ETAPE.DOCUMENTS;
  if (uiStep === 3) return BACKEND_ETAPE.BORDEREAU;
  if (uiStep === 4) return BACKEND_ETAPE.DECOMPOSITION;
  return null;
}

/** Étapes backend dont les gates s'affichent sur une étape UI. */
export function backendGateEtapesForUi(uiStep: number): number[] {
  if (uiStep === 1) return [BACKEND_ETAPE.DOCUMENTS];
  if (uiStep === 2) return [BACKEND_ETAPE.BORDEREAU];
  // Décomposition : structure + alertes consultation + prix de vente sur tous les postes
  // (gate chiffrage) — requis pour « Voir la synthèse ».
  if (uiStep === 3) {
    return [
      BACKEND_ETAPE.DECOMPOSITION,
      BACKEND_ETAPE.CONSULTATION,
      BACKEND_ETAPE.CHIFFRAGE,
    ];
  }
  return [BACKEND_ETAPE.CHIFFRAGE];
}

export function libelleUiEtape(backendStep: number): string {
  const ui = backendToUiEtape(backendStep);
  return ETAPES_UI_DOSSIER.find((e) => e.ui === ui)?.libelle ?? String(backendStep);
}

/**
 * Étape UI cible pour corriger un problème de gate.
 * Documents → 1, bordereau → 2, décomposition/consultation/chiffrage → 3 (sauf gate chiffrage → 3).
 */
export function uiEtapePourGate(backendGateEtape: number): number {
  if (backendGateEtape <= 1) return 1;
  if (backendGateEtape === 2) return 2;
  // Consultation + décomposition + articles de chiffrage se corrigent dans le workspace poste.
  return 3;
}
