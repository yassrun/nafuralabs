/**
 * i18n keys for MarcheType. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/marches/models/index.ts → MARCHE_TYPE_LABELS
 */

import type { MarcheType } from '../../pages/marches/models';

export const MARCHE_TYPE_KEYS: Record<MarcheType, string> = {
  FORFAIT: 'enum.marche.type.forfait',
  BPU:     'enum.marche.type.bpu',
  REGIE:   'enum.marche.type.regie',
  MIXTE:   'enum.marche.type.mixte',
};
