/**
 * i18n keys for Chantier Attachement status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/chantiers/attachements/attachement-listing/attachement-listing.page.ts
 */

export type AttachementStatus =
  | 'BROUILLON'
  | 'EN_ATTENTE_MOE'
  | 'SIGNE_MOE'
  | 'EN_ATTENTE_MOA'
  | 'CONTRESIGNE_MOA'
  | 'CONTESTE'
  | 'CLOS';

export const ATTACHEMENT_STATUS_KEYS: Record<AttachementStatus, string> = {
  BROUILLON:       'enum.attachement.status.brouillon',
  EN_ATTENTE_MOE:  'enum.attachement.status.en_attente_moe',
  SIGNE_MOE:       'enum.attachement.status.signe_moe',
  EN_ATTENTE_MOA:  'enum.attachement.status.en_attente_moa',
  CONTRESIGNE_MOA: 'enum.attachement.status.contresigne_moa',
  CONTESTE:        'enum.attachement.status.conteste',
  CLOS:            'enum.attachement.status.clos',
};
