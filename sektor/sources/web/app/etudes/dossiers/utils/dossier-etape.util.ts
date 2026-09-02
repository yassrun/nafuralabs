/**
 * Mapping entre étapes métier UI (4) et étapes techniques backend (5).
 *
 * Backend conserve 1..5 pour éviter une migration des dossiers existants.
 * UI : Cadrage → Bordereau → Chiffrage → Synthèse.
 * Correspondance : 1→1, 2→2, 3|4→3, 5→4.
 */

export const ETAPES_UI_DOSSIER = [
  { ui: 1, libelle: 'Cadrage & documents', nextLabel: 'Continuer vers le bordereau' },
  { ui: 2, libelle: 'Bordereau', nextLabel: 'Continuer vers le chiffrage' },
  {
    ui: 3,
    libelle: 'Chiffrage',
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
  return [BACKEND_ETAPE.DECOMPOSITION, BACKEND_ETAPE.CHIFFRAGE];
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

/**
 * Alerte qualité globale (ex. trop d’estimés) — pas un poste incomplet.
 * Sur l’étape Coût on les exclut du soft « N postes à chiffrer » / Anomalies ;
 * elles restent sur Synthèse (gate chiffrage seule).
 */
export function estAlerteQualiteChiffrage(message: string | null | undefined): boolean {
  const m = (message ?? '').trim();
  return m.includes('part_couts_estimes');
}

const TYPES_PIECE_DESTINATION = new Set([
  'REGLEMENT',
  'PLAN',
  'CPT',
  'CAUTION',
  'ATTESTATION',
  'AUTRE',
]);

/**
 * Pièces CPS / destination : rappel en synthèse (N+1), jamais un blocage du cadrage.
 * Couvre aussi une JVM encore sur l’ancienne GateDocuments.
 */
export function estAnomaliePieceHorsCadrage(probleme: {
  message?: string | null;
  codeArticle?: string | null;
}): boolean {
  const m = (probleme.message ?? '').toLowerCase();
  if (
    m.includes('piece_obligatoire')
    || m.includes('pièce obligatoire')
    || m.includes('cps_manquant')
    || m.includes('bordereau_manquant')
  ) {
    return true;
  }
  return TYPES_PIECE_DESTINATION.has((probleme.codeArticle ?? '').toUpperCase());
}

type GateIssueSlice = {
  etape: number;
  problemes: readonly { message?: string | null }[];
};

/** True when a visited UI step still has gate problems (not quality-only alerts). */
export function uiStepHasGateIssues(
  uiStep: number,
  gates: readonly GateIssueSlice[],
): boolean {
  const backendEtapes = backendGateEtapesForUi(uiStep);
  for (const g of gates) {
    if (!backendEtapes.includes(g.etape)) continue;
    for (const p of g.problemes) {
      if (uiStep === 3 && estAlerteQualiteChiffrage(p.message)) continue;
      if (uiStep === 1 && estAnomaliePieceHorsCadrage(p)) continue;
      return true;
    }
  }
  return false;
}

/**
 * 0-based wizard indexes for steps already left that still have issues.
 * Current and upcoming steps are never incomplete.
 */
export function incompleteUiStepIndexes(
  currentUi: number,
  gates: readonly GateIssueSlice[],
): number[] {
  const indexes: number[] = [];
  for (let ui = 1; ui < currentUi; ui++) {
    if (uiStepHasGateIssues(ui, gates)) indexes.push(ui - 1);
  }
  return indexes;
}
