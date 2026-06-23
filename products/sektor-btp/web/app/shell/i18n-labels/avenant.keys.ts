/**
 * i18n keys for Avenant (type + status). Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR maps at:
 *   web/app/applications/erp/pages/marches/models/index.ts → AVENANT_TYPE_LABELS, AVENANT_STATUS_LABELS
 */

import type { AvenantStatus, AvenantType } from '../../pages/marches/models';

export const AVENANT_TYPE_KEYS: Record<AvenantType, string> = {
  TVX_SUPPLEMENTAIRES:  'enum.avenant.type.tvx_supplementaires',
  PROLONGATION_DELAI:   'enum.avenant.type.prolongation_delai',
  MIXTE:                'enum.avenant.type.mixte',
  ADAPTATION_TECHNIQUE: 'enum.avenant.type.adaptation_technique',
  AUTRE:                'enum.avenant.type.autre',
};

export const AVENANT_STATUS_KEYS: Record<AvenantStatus, string> = {
  BROUILLON: 'enum.avenant.status.brouillon',
  PROPOSE:   'enum.avenant.status.propose',
  SIGNE:     'enum.avenant.status.signe',
  REJETE:    'enum.avenant.status.rejete',
};
