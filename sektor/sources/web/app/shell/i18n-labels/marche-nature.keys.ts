/**
 * i18n keys for MarcheNature. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/marches/models/index.ts → MARCHE_NATURE_LABELS
 */

import type { MarcheNature } from '../../pages/marches/models';

export const MARCHE_NATURE_KEYS: Record<MarcheNature, string> = {
  PUBLIC:              'enum.marche.nature.public',
  PRIVE_GRAND_COMPTE:  'enum.marche.nature.prive_grand_compte',
  PRIVE_PME:           'enum.marche.nature.prive_pme',
  PARTICULIER:         'enum.marche.nature.particulier',
};
