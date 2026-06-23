/**
 * i18n keys for Contrat (achats) status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/achats/contrats/config/listing/columns.ts → CT_STATUS_LABELS
 */

export type CtStatus = 'BROUILLON' | 'SIGNE' | 'EN_COURS' | 'ECHU' | 'RESILIE';

export const CT_STATUS_KEYS: Record<CtStatus, string> = {
  BROUILLON: 'enum.ct.status.brouillon',
  SIGNE:     'enum.ct.status.signe',
  EN_COURS:  'enum.ct.status.en_cours',
  ECHU:      'enum.ct.status.echu',
  RESILIE:   'enum.ct.status.resilie',
};
