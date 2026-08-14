/**
 * i18n keys for Chantier Attachement status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/chantiers/attachements/attachement-listing/attachement-listing.page.ts
 */

export type AttachementStatus =
  | 'BROUILLON'
  | 'SIGNE_MOE'
  | 'CONTRESIGNE_MOA'
  | 'CONTESTE';

export const ATTACHEMENT_STATUS_KEYS: Record<AttachementStatus, string> = {
  BROUILLON:       'enum.attachement.status.brouillon',
  SIGNE_MOE:       'enum.attachement.status.signe_moe',
  CONTRESIGNE_MOA: 'enum.attachement.status.contresigne_moa',
  CONTESTE:        'enum.attachement.status.conteste',
};
