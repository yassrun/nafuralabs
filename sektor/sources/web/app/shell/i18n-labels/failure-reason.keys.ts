/**
 * i18n keys for Session login FailureReason. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/shell/session-audit.service.ts → FAILURE_REASON_LABELS
 */

import type { FailureReason } from '../session-audit.service';

export const FAILURE_REASON_KEYS: Record<FailureReason, string> = {
  BAD_PASSWORD:   'enum.failure_reason.bad_password',
  USER_NOT_FOUND: 'enum.failure_reason.user_not_found',
  ACCOUNT_LOCKED: 'enum.failure_reason.account_locked',
  MFA_FAILED:     'enum.failure_reason.mfa_failed',
  IP_BLOCKED:     'enum.failure_reason.ip_blocked',
  EXPIRED_TOKEN:  'enum.failure_reason.expired_token',
};
