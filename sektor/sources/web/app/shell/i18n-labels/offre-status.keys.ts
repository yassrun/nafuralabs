/**
 * i18n keys for Ventes Offre status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/ventes/offres/config/listing/columns.ts → OFFRE_STATUS_LABELS
 */

export type OffreStatus =
  | 'BROUILLON'
  | 'ENVOYEE'
  | 'ACCEPTEE'
  | 'REFUSEE'
  | 'EXPIREE'
  | 'ANNULEE';

export const OFFRE_STATUS_KEYS: Record<OffreStatus, string> = {
  BROUILLON: 'enum.offre.status.brouillon',
  ENVOYEE:   'enum.offre.status.envoyee',
  ACCEPTEE:  'enum.offre.status.acceptee',
  REFUSEE:   'enum.offre.status.refusee',
  EXPIREE:   'enum.offre.status.expiree',
  ANNULEE:   'enum.offre.status.annulee',
};
