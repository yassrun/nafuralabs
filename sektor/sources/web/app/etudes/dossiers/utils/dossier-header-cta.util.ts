/**
 * Header CTA vs wizard footer.
 *
 * Wizard next/submit lives in nf-wizard-shell footer. The dossier header
 * must not repeat the same primary.
 */
export type HeaderCtaSlot = 'hidden' | 'jump' | 'primary';

const WIZARD_FOOTER_ACTIONS = new Set([
  'SOUMETTRE_CHIFFRAGE',
  'SOUMETTRE_STRUCTURE',
  'CORRIGER_BORDEREAU',
  'CORRIGER_CHIFFRAGE',
]);

export function headerCtaSlot(actionEffective: string | undefined | null): HeaderCtaSlot {
  if (!actionEffective) return 'hidden';
  if (WIZARD_FOOTER_ACTIONS.has(actionEffective)) return 'hidden';
  if (actionEffective === 'VOIR_SYNTHESE') return 'jump';
  return 'primary';
}
