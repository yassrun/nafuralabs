/**
 * i18n keys for Écriture comptable status + origine. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR maps at:
 *   web/app/applications/erp/pages/finance/journaux/ecritures-listing/ecritures-listing.page.ts
 */

export type EcritureStatus = 'BROUILLON' | 'VALIDEE' | 'CLOTUREE';

export const ECRITURE_STATUS_KEYS: Record<EcritureStatus, string> = {
  BROUILLON: 'enum.ecriture.status.brouillon',
  VALIDEE:   'enum.ecriture.status.validee',
  CLOTUREE:  'enum.ecriture.status.cloturee',
};

export type EcritureOrigine =
  | 'MANUELLE'
  | 'AUTO_FACTURE_CLIENT'
  | 'AUTO_FACTURE_FOURN'
  | 'AUTO_REGLEMENT'
  | 'AUTO_PAIE'
  | 'AUTO_AVOIR'
  | 'AUTO_SITUATION';

export const ECRITURE_ORIGINE_KEYS: Record<EcritureOrigine, string> = {
  MANUELLE:            'enum.ecriture.origine.manuelle',
  AUTO_FACTURE_CLIENT: 'enum.ecriture.origine.auto_facture_client',
  AUTO_FACTURE_FOURN:  'enum.ecriture.origine.auto_facture_fourn',
  AUTO_REGLEMENT:      'enum.ecriture.origine.auto_reglement',
  AUTO_PAIE:           'enum.ecriture.origine.auto_paie',
  AUTO_AVOIR:          'enum.ecriture.origine.auto_avoir',
  AUTO_SITUATION:      'enum.ecriture.origine.auto_situation',
};
