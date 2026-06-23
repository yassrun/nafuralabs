/**
 * i18n keys for Demande d'Achat status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/achats/demandes/config/listing/columns.ts → DA_STATUS_LABELS
 */

export type DaStatus = 'BROUILLON' | 'SOUMISE' | 'APPROUVEE' | 'REJETEE' | 'CONVERTIE';

export const DA_STATUS_KEYS: Record<DaStatus, string> = {
  BROUILLON: 'enum.da.status.brouillon',
  SOUMISE:   'enum.da.status.soumise',
  APPROUVEE: 'enum.da.status.approuvee',
  REJETEE:   'enum.da.status.rejetee',
  CONVERTIE: 'enum.da.status.convertie',
};
