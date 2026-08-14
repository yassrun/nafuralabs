/**
 * i18n keys for Achats Appels d'Offres status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/achats/appels-offres/config/listing/columns.ts → AO_STATUS_LABELS
 */

export type AoStatus =
  | 'BROUILLON'
  | 'PUBLIEE'
  | 'CLOTUREE'
  | 'ATTRIBUEE'
  | 'INFRUCTUEUSE'
  | 'ANNULEE';

export const AO_STATUS_KEYS: Record<AoStatus, string> = {
  BROUILLON:    'enum.ao.status.brouillon',
  PUBLIEE:      'enum.ao.status.publiee',
  CLOTUREE:     'enum.ao.status.cloturee',
  ATTRIBUEE:    'enum.ao.status.attribuee',
  INFRUCTUEUSE: 'enum.ao.status.infructueuse',
  ANNULEE:      'enum.ao.status.annulee',
};
