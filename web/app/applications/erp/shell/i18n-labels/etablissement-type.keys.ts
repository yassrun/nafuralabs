/**
 * i18n keys for EtablissementType. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/administration/societe/models/index.ts → ETABLISSEMENT_TYPE_LABELS
 */

import type { EtablissementType } from '../../pages/administration/societe/models';

export const ETABLISSEMENT_TYPE_KEYS: Record<EtablissementType, string> = {
  SIEGE:          'enum.etablissement_type.siege',
  FILIALE:        'enum.etablissement_type.filiale',
  AGENCE:         'enum.etablissement_type.agence',
  CHANTIER_BASE:  'enum.etablissement_type.chantier_base',
};
