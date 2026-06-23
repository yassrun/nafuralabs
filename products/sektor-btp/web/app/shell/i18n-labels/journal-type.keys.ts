/**
 * i18n keys for Journal comptable type. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/finance/plans-comptables/components/journal-config/journal-config.component.ts → TYPE_LABELS
 */

import type { JournalType } from '../../finance/models';

export const JOURNAL_TYPE_KEYS: Record<JournalType, string> = {
  VENTE:               'enum.journal.type.vente',
  ACHAT:               'enum.journal.type.achat',
  BANQUE:              'enum.journal.type.banque',
  CAISSE:              'enum.journal.type.caisse',
  OPERATIONS_DIVERSES: 'enum.journal.type.operations_diverses',
  NOUVEAUX:            'enum.journal.type.nouveaux',
};
