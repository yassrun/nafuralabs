import type { BadgeVariant } from '@platform/lib/anatomy/types';
import type { StatutDossierEtude } from '@app/etudes/models';

/** Ancien code persisté / API non migrée → code du workflow actuel. */
export const STATUT_DOSSIER_LEGACY: Record<string, StatutDossierEtude> = {
  BROUILLON: 'DRAFT',
  A_DECIDER: 'PENDING_ASSIGNMENT',
  NE_PAS_ETUDIER: 'REJECTED',
  AFFECTE: 'ASSIGNED',
  REJETE_CHIFFRAGE: 'STUDY_REJECTED',
  EN_ETUDE: 'IN_PROGRESS',
  A_AVIS_EXECUTION: 'IN_PROGRESS',
  SUSPENDU: 'SUSPENDED',
  EN_VALIDATION: 'COMPLETED',
  VALIDEE: 'FINANCIALLY_APPROVED',
  DEVIS_GENERE: 'FINAL_APPROVED',
  GAGNE: 'FINAL_APPROVED',
  CONVERTIE: 'FINAL_APPROVED',
  PERDU: 'ARCHIVED',
  ANNULE: 'ARCHIVED',
};

export function normalizeStatutDossier(
  status: string | undefined | null,
): StatutDossierEtude | '' {
  if (!status) return '';
  return STATUT_DOSSIER_LEGACY[status] ?? (status as StatutDossierEtude);
}

export function hydrateStatut<T extends { status?: string }>(item: T): T {
  const next = normalizeStatutDossier(item.status);
  if (!next || next === item.status) return item;
  return { ...item, status: next };
}

export const DOSSIER_STATUT_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING_ASSIGNMENT: 'En attente d’affectation',
  REJECTED: 'Rejeté',
  ASSIGNED: 'Affecté',
  STUDY_REJECTED: 'Refusé par l’étude',
  IN_PROGRESS: 'En cours',
  SUSPENDED: 'Suspendu',
  COMPLETED: 'Chiffrage terminé',
  FINANCIALLY_APPROVED: 'Validé financièrement',
  FINANCIALLY_REJECTED: 'Refusé financièrement',
  FINAL_APPROVED: 'Validé définitivement',
  FINAL_REJECTED: 'Refusé en validation finale',
  ARCHIVED: 'Archivé',
};

export const DOSSIER_STATUT_VARIANTS: Record<string, BadgeVariant> = {
  DRAFT: 'default',
  PENDING_ASSIGNMENT: 'info',
  REJECTED: 'danger',
  ASSIGNED: 'warning',
  STUDY_REJECTED: 'danger',
  IN_PROGRESS: 'warning',
  SUSPENDED: 'warning',
  COMPLETED: 'info',
  FINANCIALLY_APPROVED: 'success',
  FINANCIALLY_REJECTED: 'danger',
  FINAL_APPROVED: 'success',
  FINAL_REJECTED: 'danger',
  ARCHIVED: 'default',
};

export const PHASE_LABELS: Record<string, string> = {
  BORDEREAU: 'Bordereau',
  CHIFFRAGE: 'Chiffrage',
  VALIDATION_N1: 'Validation financière',
  VALIDATION_N2: 'Validation définitive',
  VALIDEE: 'Validée',
  DEVIS: 'Devis généré',
  TERMINE: 'Terminé',
  FINAL_REJECTED: 'Refusé en validation finale',
  ARCHIVED: 'Archivé',
};

export const STATUTS_EN_ATTENTE = [
  'PENDING_ASSIGNMENT',
  'ASSIGNED',
  'COMPLETED',
  'FINANCIALLY_APPROVED',
  'STUDY_REJECTED',
] as const;

export const PIPELINE_STATUTS = [
  'DRAFT',
  'PENDING_ASSIGNMENT',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'FINANCIALLY_APPROVED',
  'FINAL_APPROVED',
] as const;

export function estEnAttente(status: string | undefined | null): boolean {
  const n = normalizeStatutDossier(status);
  return !!n && (STATUTS_EN_ATTENTE as readonly string[]).includes(n);
}

export const PHASE_FLOW = [
  'BORDEREAU',
  'CHIFFRAGE',
  'VALIDATION_N1',
  'VALIDATION_N2',
  'DEVIS',
] as const;

export function labelStatutDossier(status: string | undefined | null): string {
  const n = normalizeStatutDossier(status);
  if (!n) return '';
  return DOSSIER_STATUT_LABELS[n] ?? n;
}

export function labelEtatListing(
  status: string | undefined | null,
  _currentStep?: number | null,
): string {
  return labelStatutDossier(status);
}

export function variantEtatListing(status: string | undefined | null): BadgeVariant {
  return DOSSIER_STATUT_VARIANTS[normalizeStatutDossier(status)] ?? 'default';
}

export function labelPhase(phase: string | undefined | null): string {
  if (!phase) return '';
  return PHASE_LABELS[phase] ?? phase;
}
