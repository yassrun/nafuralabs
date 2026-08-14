/**
 * i18n keys for Caution bancaire (type + status). Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR maps at:
 *   web/app/applications/erp/pages/marches/models/index.ts → CAUTION_TYPE_LABELS, CAUTION_STATUS_LABELS
 */

import type { CautionStatus, CautionType } from '../../pages/marches/models';

export const CAUTION_TYPE_KEYS: Record<CautionType, string> = {
  PROVISOIRE:         'enum.caution.type.provisoire',
  DEFINITIVE:         'enum.caution.type.definitive',
  RESTITUTION_AVANCE: 'enum.caution.type.restitution_avance',
  RETENUE_GARANTIE:   'enum.caution.type.retenue_garantie',
};

export const CAUTION_STATUS_KEYS: Record<CautionStatus, string> = {
  EMISE:   'enum.caution.status.emise',
  ACTIVE:  'enum.caution.status.active',
  LEVEE:   'enum.caution.status.levee',
  EXPIRE:  'enum.caution.status.expire',
  JOUE:    'enum.caution.status.joue',
};
