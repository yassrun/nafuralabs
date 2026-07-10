/**
 * i18n keys for LoginOutcome. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/shell/session-audit.service.ts → OUTCOME_LABELS
 */

import type { LoginOutcome } from '../session-audit.service';

export const OUTCOME_KEYS: Record<LoginOutcome, string> = {
  SUCCESS: 'enum.outcome.success',
  FAILED:  'enum.outcome.failed',
  TIMEOUT: 'enum.outcome.timeout',
};
