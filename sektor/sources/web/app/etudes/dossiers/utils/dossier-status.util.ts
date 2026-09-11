import type { BadgeVariant } from '@platform/lib/anatomy/types';

/**
 * Libellés v1 — à raffiner.
 * Draft → À affecter (DG) → Affecté (chargé) → En chiffrage → Chiffré
 * → Validé intern → Validé. Branche : Suspendu.
 */
export const DOSSIER_STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Draft',
  A_DECIDER: 'À affecter',
  AFFECTE: 'Affecté',
  EN_ETUDE: 'En chiffrage',
  EN_VALIDATION: 'Chiffré',
  VALIDEE: 'Validé intern',
  DEVIS_GENERE: 'Validé',
  GAGNE: 'Gagné',
  PERDU: 'Perdu',
  CONVERTIE: 'Convertie',
  ANNULE: 'Archivé',
  NE_PAS_ETUDIER: 'Rejeté',
  REJETE_CHIFFRAGE: 'Rejeté par le chiffrage',
  SUSPENDU: 'Suspendu',
  A_AVIS_EXECUTION: 'Avis d’exécution',
};

export const DOSSIER_STATUT_VARIANTS: Record<string, BadgeVariant> = {
  BROUILLON: 'default',
  A_DECIDER: 'info',
  AFFECTE: 'warning',
  EN_ETUDE: 'warning',
  EN_VALIDATION: 'info',
  VALIDEE: 'success',
  DEVIS_GENERE: 'success',
  GAGNE: 'success',
  PERDU: 'danger',
  CONVERTIE: 'success',
  ANNULE: 'default',
  NE_PAS_ETUDIER: 'danger',
  REJETE_CHIFFRAGE: 'danger',
  SUSPENDU: 'warning',
  A_AVIS_EXECUTION: 'warning',
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
  NE_PAS_ETUDIER: 'Rejeté',
  REJETE_CHIFFRAGE: 'Rejeté par le chiffrage',
  SUSPENDU: 'Suspendu',
};

/** File d’attente dashboard / listing : quelqu’un d’autre doit agir. */
export const STATUTS_EN_ATTENTE = [
  'A_DECIDER',
  'AFFECTE',
  'EN_VALIDATION',
  'A_AVIS_EXECUTION',
  'REJETE_CHIFFRAGE',
] as const;

export const PIPELINE_STATUTS = [
  'BROUILLON',
  'A_DECIDER',
  'AFFECTE',
  'EN_ETUDE',
  'A_AVIS_EXECUTION',
  'EN_VALIDATION',
  'VALIDEE',
  'DEVIS_GENERE',
] as const;

export function estEnAttente(status: string | undefined | null): boolean {
  return !!status && (STATUTS_EN_ATTENTE as readonly string[]).includes(status);
}

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

/**
 * Listing : le statut métier, jamais l’étape wizard.
 */
export function labelEtatListing(
  status: string | undefined | null,
  _currentStep?: number | null,
): string {
  return labelStatutDossier(status);
}

export function variantEtatListing(status: string | undefined | null): BadgeVariant {
  return DOSSIER_STATUT_VARIANTS[String(status ?? '')] ?? 'default';
}

export function labelPhase(phase: string | undefined | null): string {
  if (!phase) return '';
  return PHASE_LABELS[phase] ?? phase;
}

