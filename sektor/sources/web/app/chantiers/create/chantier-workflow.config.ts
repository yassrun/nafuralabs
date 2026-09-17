import type { StatusActionBarConfig, WizardStepConfig } from '@platform/lib/anatomy';

/**
 * Parcours de préparation du chantier — ce qui se décide avant le premier coup de pioche.
 *
 * L'étude n'est qu'une aide au préremplissage : le chantier constitue son propre dossier. Les
 * pièces de l'étude ne sont jamais reprises automatiquement, elles peuvent avoir changé.
 */
export const CHANTIER_PREPARATION_STEPS: WizardStepConfig[] = [
  { id: 'cadrage', label: 'Cadrage et documents' },
  { id: 'bdp', label: 'BDP chiffré' },
  { id: 'equipe', label: 'Équipe' },
  { id: 'demarrage', label: 'Démarrage' },
];

/** Suivi du cycle de vie, à partir du démarrage par ordre de service. */
export const CHANTIER_LIFECYCLE_STEPS: WizardStepConfig[] = [
  { id: 'execution', label: 'Exécution' },
  { id: 'provisoire', label: 'Réception provisoire' },
  { id: 'definitive', label: 'Réception définitive' },
  { id: 'garanties', label: 'Garanties & clôture' },
];

export const CHANTIER_STEPS: WizardStepConfig[] = [
  ...CHANTIER_PREPARATION_STEPS,
  ...CHANTIER_LIFECYCLE_STEPS,
];

export const PREPARATION_STEP_COUNT = CHANTIER_PREPARATION_STEPS.length;

/** Statuts d'avant démarrage : le parcours affiché est celui de la préparation. */
const PREPARATION_STATUSES = ['BROUILLON', 'EN_PREPARATION', 'PRET_A_DEMARRER', 'ANNULE'];

export function enPreparation(status: string): boolean {
  return PREPARATION_STATUSES.includes(status);
}

/**
 * Étape du cycle de vie, en index absolu dans {@link CHANTIER_STEPS}. La suspension ne crée pas
 * d'étape : elle se suit sur l'exécution. Un chantier clôturé garde l'étape des garanties.
 */
export function lifecycleStep(status: string): number {
  const offsets: Record<string, number> = {
    EN_COURS: 0,
    SUSPENDU: 0,
    EN_ATTENTE_RECEPTION_PROVISOIRE: 1,
    RECEPTIONNE_PROVISOIRE: 2,
    RECEPTIONNE_DEFINITIF: 3,
    CLOS: 3,
  };
  return PREPARATION_STEP_COUNT + (offsets[status] ?? 0);
}

/**
 * Étape de préparation atteinte, déduite des blocages du serveur — jamais de la navigation.
 * Cadrage incomplet → cadrage ; BDP à vérifier → BDP ; équipe manquante → équipe ; sinon démarrage.
 */
export function preparationStep(blockers: readonly string[]): number {
  const cadrage = ['identite_client', 'identite_chantier', 'cps', 'bdp'];
  if (blockers.some((code) => cadrage.includes(code))) return 0;
  if (blockers.includes('bdp_chiffre')) return 1;
  if (blockers.includes('responsables')) return 2;
  return 3;
}

export const CHANTIER_STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'En préparation', EN_PREPARATION: 'En préparation', PRET_A_DEMARRER: 'Prêt à démarrer',
  EN_COURS: 'En cours', SUSPENDU: 'Suspendu', EN_ATTENTE_RECEPTION_PROVISOIRE: 'En attente de réception provisoire',
  RECEPTIONNE_PROVISOIRE: 'Réceptionné provisoirement', RECEPTIONNE_DEFINITIF: 'Réceptionné définitivement', CLOS: 'Clôturé', ANNULE: 'Annulé',
};

export const ACTION_LABELS: Record<string, string> = {
  SAVE_PREPARATION: 'Enregistrer les informations du chantier', VALIDATE_BDP: 'Valider le BDP chiffré',
  VALIDATE_PREPARATION: 'Valider la préparation', RETURN_PREPARATION: 'Reprendre la préparation',
  SAVE_OS: "Enregistrer l’OS", START: 'Démarrer le chantier', SUSPEND: 'Suspendre', RESUME: 'Reprendre', FINISH_WORK: 'Déclarer les travaux terminés', RESUME_WORK: 'Reprendre les travaux',
  PROVISIONAL_RECEPTION: 'Enregistrer la réception provisoire', FINAL_RECEPTION: 'Enregistrer la réception définitive', CLOSE: 'Clôturer le chantier', CANCEL: 'Annuler le chantier',
  ADD_RESERVE: 'Ajouter une réserve', UPDATE_RESERVE: 'Mettre à jour la réserve', ADD_GARANTIE: 'Ajouter une garantie', UPDATE_GARANTIE: 'Mettre à jour la garantie',
};

/** Ce qui bloque la validation de la préparation, et l'endroit où le corriger. */
export const BLOCKER_LABELS: Record<string, string> = {
  identite_client: 'Client à compléter', identite_chantier: 'Nom et ville à compléter',
  reference_vente: 'Référence commerciale à vérifier', arbre: 'Périmètre à compléter',
  budget_initial: 'Déboursé initial à compléter', responsables: 'Conducteur et chef de chantier à affecter',
  delai_execution: "Délai d’exécution à renseigner au cadrage",
  dates_prevues: 'Dates prévisionnelles à compléter ou corriger',
  cps: 'CPS du chantier à déposer', bdp: 'BDP du chantier à déposer',
  bdp_chiffre: 'BDP chiffré à vérifier et valider',
  marche_reference: 'Référence du marché à renseigner', marche_signe: 'Marché signé à déposer',
};

/** Pourquoi le BDP chiffré n'est pas encore validable. */
export const BDP_MANQUE_LABELS: Record<string, string> = {
  bdp_vide: 'Aucune ligne au bordereau : importez le BDP ou saisissez les lignes',
  bdp_quantite: 'Une ligne vendue porte une quantité nulle ou absente',
  bdp_prix: 'Une ligne vendue n’a pas de prix unitaire',
  bdp_total: 'Le bordereau ne porte aucun montant vendu',
};

export interface ChantierStatusContext { status: string; availableActions: string[]; }
const transitions = [
  ['EN_PREPARATION', 'PRET_A_DEMARRER', 'VALIDATE_PREPARATION'], ['BROUILLON', 'PRET_A_DEMARRER', 'VALIDATE_PREPARATION'], ['PRET_A_DEMARRER', 'EN_COURS', 'START'],
  ['EN_COURS', 'EN_ATTENTE_RECEPTION_PROVISOIRE', 'FINISH_WORK'], ['SUSPENDU', 'EN_COURS', 'RESUME'], ['EN_ATTENTE_RECEPTION_PROVISOIRE', 'RECEPTIONNE_PROVISOIRE', 'PROVISIONAL_RECEPTION'],
  ['RECEPTIONNE_PROVISOIRE', 'RECEPTIONNE_DEFINITIF', 'FINAL_RECEPTION'], ['RECEPTIONNE_DEFINITIF', 'CLOS', 'CLOSE'], ['EN_COURS', 'SUSPENDU', 'SUSPEND'],
  ['PRET_A_DEMARRER', 'EN_PREPARATION', 'RETURN_PREPARATION'], ['EN_ATTENTE_RECEPTION_PROVISOIRE', 'EN_COURS', 'RESUME_WORK'],
];
export const CHANTIER_STATUS_BAR: StatusActionBarConfig<string, ChantierStatusContext> = {
  statuses: Object.fromEntries(Object.entries(CHANTIER_STATUS_LABELS).map(([key, label]) => [key, { label, variant: key === 'SUSPENDU' ? 'warning' : key === 'CLOS' ? 'success' : 'info' }])),
  transitions: transitions.map(([from, to, action], i) => ({ from, to, action, actionLabel: ACTION_LABELS[action], variant: i < 8 ? 'primary' : 'ghost', hasAccess: ctx => ctx.availableActions.includes(action) })),
};
