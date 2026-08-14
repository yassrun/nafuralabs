/**
 * i18n keys for Chantier Situation status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/chantiers/situations/config/listing/columns.ts → STATUS_LABELS
 */

export type SituationStatus =
  | 'BROUILLON'
  | 'SOUMISE'
  | 'VALIDEE_MOA'
  | 'FACTUREE'
  | 'PAYEE'
  | 'REJETEE';

export const SITUATION_STATUS_KEYS: Record<SituationStatus, string> = {
  BROUILLON:   'enum.situation.status.brouillon',
  SOUMISE:     'enum.situation.status.soumise',
  VALIDEE_MOA: 'enum.situation.status.validee_moa',
  FACTUREE:    'enum.situation.status.facturee',
  PAYEE:       'enum.situation.status.payee',
  REJETEE:     'enum.situation.status.rejetee',
};
