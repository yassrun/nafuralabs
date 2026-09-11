/**
 * Header = statut + Enregistrer.
 * Wizard footer = navigation d’étape seulement.
 */
export type HeaderCtaSlot = 'hidden' | 'jump' | 'primary';

const WIZARD_NAV_ACTIONS = new Set([
  'SOUMETTRE_STRUCTURE',
  'CORRIGER_BORDEREAU',
  'CORRIGER_CHIFFRAGE',
  'VOIR_SYNTHESE',
]);

export function headerCtaSlot(actionEffective: string | undefined | null): HeaderCtaSlot {
  if (!actionEffective) return 'hidden';
  if (WIZARD_NAV_ACTIONS.has(actionEffective)) return 'hidden';
  return 'primary';
}
