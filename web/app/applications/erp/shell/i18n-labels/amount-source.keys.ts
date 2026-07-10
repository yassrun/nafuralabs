/**
 * i18n keys for Mapping comptable AmountSource. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/administration/mappings-comptables/mappings-comptables.page.ts → AMOUNT_SOURCE_LABELS
 */

import type { AmountSource } from '../comptable-mapping.service';

export const AMOUNT_SOURCE_KEYS: Record<AmountSource, string> = {
  HT:           'enum.amount_source.ht',
  TVA:          'enum.amount_source.tva',
  TTC:          'enum.amount_source.ttc',
  RAS:          'enum.amount_source.ras',
  NET_A_PAYER:  'enum.amount_source.net_a_payer',
  TIMBRE:       'enum.amount_source.timbre',
  CHARGE_PATR:  'enum.amount_source.charge_patr',
  SALAIRE_NET:  'enum.amount_source.salaire_net',
  IR:           'enum.amount_source.ir',
};
