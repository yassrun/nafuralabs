/**
 * i18n keys for Chantier status & type. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR maps at:
 *   - web/app/applications/erp/pages/chantiers/chantiers-listing/chantiers-listing.page.ts
 *   - web/app/applications/erp/pages/chantiers/chantier-detail/chantier-detail.page.ts
 */

import type { ChantierStatus } from '../../chantiers/models';

export const CHANTIER_STATUS_KEYS: Record<ChantierStatus, string> = {
  PROSPECT:    'enum.chantier.status.prospect',
  EN_COURS:    'enum.chantier.status.en_cours',
  SUSPENDU:    'enum.chantier.status.suspendu',
  TERMINE:     'enum.chantier.status.termine',
  RECEPTIONNE: 'enum.chantier.status.receptionne',
  CLOTURE:     'enum.chantier.status.cloture',
  ANNULE:      'enum.chantier.status.annule',
};

export type ChantierType =
  | 'BATIMENT'
  | 'TP'
  | 'VRD'
  | 'GO'
  | 'TCE'
  | 'REHABILITATION';

export const CHANTIER_TYPE_KEYS: Record<ChantierType, string> = {
  BATIMENT:       'enum.chantier.type.batiment',
  TP:             'enum.chantier.type.tp',
  VRD:            'enum.chantier.type.vrd',
  GO:             'enum.chantier.type.go',
  TCE:            'enum.chantier.type.tce',
  REHABILITATION: 'enum.chantier.type.rehabilitation',
};
