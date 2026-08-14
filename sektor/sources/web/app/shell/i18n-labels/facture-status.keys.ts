/**
 * i18n keys for Ventes / Facture statuses + types. Centralised in Phase 1.2 (i18n roadmap, agent B2).
 *
 * Replaces the per-page hardcoded FR maps previously declared at:
 *   - web/app/applications/erp/pages/ventes/factures/config/listing/columns.ts (STATUS_LABELS + TYPE_LABELS)
 *
 * Consume via `{{ FACTURE_STATUS_KEYS[status] | translate }}` in templates,
 * or `translateService.instant(FACTURE_STATUS_KEYS[status])` in TS.
 */

export type FactureStatus =
  | 'BROUILLON'
  | 'EMISE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'EN_LITIGE'
  | 'AVOIRISEE'
  | 'ANNULEE';

export const FACTURE_STATUS_KEYS: Record<FactureStatus, string> = {
  BROUILLON:           'enum.facture.status.brouillon',
  EMISE:               'enum.facture.status.emise',
  PARTIELLEMENT_PAYEE: 'enum.facture.status.partiellement_payee',
  PAYEE:               'enum.facture.status.payee',
  EN_LITIGE:           'enum.facture.status.en_litige',
  AVOIRISEE:           'enum.facture.status.avoirisee',
  ANNULEE:             'enum.facture.status.annulee',
};

export type FactureType =
  | 'SITUATION'
  | 'AVANCE'
  | 'ACOMPTE'
  | 'DECOMPTE_DEFINITIF'
  | 'DIVERSE';

export const FACTURE_TYPE_KEYS: Record<FactureType, string> = {
  SITUATION:          'enum.facture.type.situation',
  AVANCE:             'enum.facture.type.avance',
  ACOMPTE:            'enum.facture.type.acompte',
  DECOMPTE_DEFINITIF: 'enum.facture.type.decompte_definitif',
  DIVERSE:            'enum.facture.type.diverse',
};
