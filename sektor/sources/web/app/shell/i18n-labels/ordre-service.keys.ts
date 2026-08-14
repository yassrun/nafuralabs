/**
 * i18n keys for OrdreService (type + status). Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR maps at:
 *   web/app/applications/erp/pages/marches/models/index.ts → ORDRE_SERVICE_TYPE_LABELS, ORDRE_SERVICE_STATUS_LABELS
 */

import type { OrdreServiceStatus, OrdreServiceType } from '../../pages/marches/models';

export const ORDRE_SERVICE_TYPE_KEYS: Record<OrdreServiceType, string> = {
  COMMENCEMENT:  'enum.ordre_service.type.commencement',
  ARRET:         'enum.ordre_service.type.arret',
  REPRISE:       'enum.ordre_service.type.reprise',
  MODIFICATION:  'enum.ordre_service.type.modification',
  NOTIFICATION:  'enum.ordre_service.type.notification',
};

export const ORDRE_SERVICE_STATUS_KEYS: Record<OrdreServiceStatus, string> = {
  EMIS:        'enum.ordre_service.status.emis',
  RECEPTIONNE: 'enum.ordre_service.status.receptionne',
  CONTESTE:    'enum.ordre_service.status.conteste',
  CLOS:        'enum.ordre_service.status.clos',
};
