/**
 * i18n keys for FactureMarcheStatus. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/marches/models/index.ts → FACTURE_STATUS_LABELS
 * Note: kept distinct from the ventes `FactureStatus` because the marche
 * billing lifecycle is different (envoyée MOA / acceptée / contestée).
 */

import type { FactureMarcheStatus } from '../../pages/marches/models';

export const FACTURE_MARCHE_STATUS_KEYS: Record<FactureMarcheStatus, string> = {
  BROUILLON:     'enum.facture_marche.status.brouillon',
  EMISE:         'enum.facture_marche.status.emise',
  ENVOYEE_MOA:   'enum.facture_marche.status.envoyee_moa',
  ACCEPTEE:      'enum.facture_marche.status.acceptee',
  PAYEE_PARTIEL: 'enum.facture_marche.status.payee_partiel',
  PAYEE:         'enum.facture_marche.status.payee',
  CONTESTEE:     'enum.facture_marche.status.contestee',
};
