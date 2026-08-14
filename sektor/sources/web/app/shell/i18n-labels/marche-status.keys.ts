/**
 * i18n keys for MarcheStatus. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/marches/models/index.ts → MARCHE_STATUS_LABELS
 */

import type { MarcheStatus } from '../../pages/marches/models';

export const MARCHE_STATUS_KEYS: Record<MarcheStatus, string> = {
  BROUILLON:            'enum.marche.status.brouillon',
  SIGNE:                'enum.marche.status.signe',
  EN_EXECUTION:         'enum.marche.status.en_execution',
  RECEPTION_PROVISOIRE: 'enum.marche.status.reception_provisoire',
  RECEPTION_DEFINITIVE: 'enum.marche.status.reception_definitive',
  CLOTURE:              'enum.marche.status.cloture',
  RESILIE:              'enum.marche.status.resilie',
};
