/**
 * i18n keys for Conditions de paiement type. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/finance/conditions-paiement/config/listing/columns.ts → TYPE_LABELS
 */

export type ConditionPaiementType =
  | 'IMMEDIAT'
  | 'DELAI_SIMPLE'
  | 'FIN_DE_MOIS'
  | 'ECHEANCES_MULTIPLES';

export const CONDITION_PAIEMENT_TYPE_KEYS: Record<ConditionPaiementType, string> = {
  IMMEDIAT:             'enum.condition_paiement.type.immediat',
  DELAI_SIMPLE:         'enum.condition_paiement.type.delai_simple',
  FIN_DE_MOIS:          'enum.condition_paiement.type.fin_de_mois',
  ECHEANCES_MULTIPLES:  'enum.condition_paiement.type.echeances_multiples',
};
