/**
 * i18n keys for Ventes Avoir status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/ventes/avoirs/config/listing/columns.ts → STATUS_LABELS
 */

export type AvoirStatus = 'BROUILLON' | 'EMIS' | 'IMPUTE' | 'REMBOURSE' | 'ANNULE';

export const AVOIR_STATUS_KEYS: Record<AvoirStatus, string> = {
  BROUILLON: 'enum.avoir.status.brouillon',
  EMIS:      'enum.avoir.status.emis',
  IMPUTE:    'enum.avoir.status.impute',
  REMBOURSE: 'enum.avoir.status.rembourse',
  ANNULE:    'enum.avoir.status.annule',
};
