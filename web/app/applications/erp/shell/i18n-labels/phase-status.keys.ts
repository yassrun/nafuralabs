/**
 * i18n keys for Chantier Phase status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/chantiers/chantier-detail/chantier-detail.page.ts → PHASE_STATUS_LABELS
 */

export type PhaseStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'EN_RETARD';

export const PHASE_STATUS_KEYS: Record<PhaseStatus, string> = {
  PLANIFIE:  'enum.phase_status.planifie',
  EN_COURS:  'enum.phase_status.en_cours',
  TERMINE:   'enum.phase_status.termine',
  EN_RETARD: 'enum.phase_status.en_retard',
};
