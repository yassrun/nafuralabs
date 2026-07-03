/**
 * i18n keys for Pointage Mode. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/rh/pointage/models/index.ts → MODE_LABELS
 */

import type { PointageMode } from '../../pages/rh/pointage/models';

export const MODE_KEYS: Record<PointageMode, string> = {
  PRESENT:   'enum.pointage_mode.present',
  ABSENT:    'enum.pointage_mode.absent',
  CONGE:     'enum.pointage_mode.conge',
  MALADIE:   'enum.pointage_mode.maladie',
  FORMATION: 'enum.pointage_mode.formation',
  AUTRE:     'enum.pointage_mode.autre',
};
