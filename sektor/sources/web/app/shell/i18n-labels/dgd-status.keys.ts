/**
 * i18n keys for DgdStatus. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/marches/models/index.ts → DGD_STATUS_LABELS
 */

import type { DgdStatus } from '../../pages/marches/models';

export const DGD_STATUS_KEYS: Record<DgdStatus, string> = {
  BROUILLON:   'enum.dgd.status.brouillon',
  SOUMIS_MOA:  'enum.dgd.status.soumis_moa',
  NOTIFIE:     'enum.dgd.status.notifie',
  PAYE:        'enum.dgd.status.paye',
  CONTESTE:    'enum.dgd.status.conteste',
};
