import type { BadgeVariant } from '@lib/anatomy/types';

/** Libellés et variantes partagés liste + détail dossier d'étude. */
export const DOSSIER_STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EN_ETUDE: 'En étude',
  EN_VALIDATION: 'En validation',
  VALIDEE: 'Validée',
  DEVIS_GENERE: 'Devis généré',
  GAGNE: 'Gagné',
  PERDU: 'Perdu',
  CONVERTIE: 'Convertie',
  ANNULE: 'Annulé',
};

export const DOSSIER_STATUT_VARIANTS: Record<string, BadgeVariant> = {
  BROUILLON: 'default',
  EN_ETUDE: 'warning',
  EN_VALIDATION: 'info',
  VALIDEE: 'success',
  DEVIS_GENERE: 'info',
  GAGNE: 'success',
  PERDU: 'danger',
  CONVERTIE: 'success',
  ANNULE: 'default',
};

export const PHASE_LABELS: Record<string, string> = {
  BORDEREAU: 'Bordereau',
  CHIFFRAGE: 'Chiffrage',
  VALIDATION_N1: 'Validation N+1',
  VALIDATION_N2: 'Validation N+2',
  VALIDEE: 'Validée',
  DEVIS: 'Devis généré',
  TERMINE: 'Terminé',
  PERDU: 'Perdu',
  ANNULE: 'Annulé',
};

export const PHASE_FLOW = [
  'BORDEREAU',
  'CHIFFRAGE',
  'VALIDATION_N1',
  'VALIDATION_N2',
  'DEVIS',
] as const;

export function labelStatutDossier(status: string | undefined | null): string {
  if (!status) return '';
  return DOSSIER_STATUT_LABELS[status] ?? status;
}

export function labelPhase(phase: string | undefined | null): string {
  if (!phase) return '';
  return PHASE_LABELS[phase] ?? phase;
}
