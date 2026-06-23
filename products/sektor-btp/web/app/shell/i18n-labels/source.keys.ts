/**
 * i18n keys for Taux de change Source. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/finance/taux-change/config/listing/columns.ts → SOURCE_LABELS
 */

export type ExchangeRateSource = 'BAM' | 'MANUEL' | 'API';

export const SOURCE_KEYS: Record<ExchangeRateSource, string> = {
  BAM:    'enum.source.bam',
  MANUEL: 'enum.source.manuel',
  API:    'enum.source.api',
};
