/**
 * i18n keys for Études module (devis, métrés, appels d'offres clients).
 * Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR maps at:
 *   - web/app/applications/erp/pages/etudes/devis/config/listing/columns.ts → STATUS_LABELS
 *   - web/app/applications/erp/pages/etudes/metres/config/listing/columns.ts → STATUS_LABELS
 *   - web/app/applications/erp/pages/etudes/appels-offres-clients/config/listing/columns.ts → STATUS_LABELS, TYPE_LABELS
 */

export type DevisStatus =
  | 'BROUILLON'
  | 'EMIS'
  | 'NEGOCIATION'
  | 'APPROUVE'
  | 'PERDU'
  | 'ANNULE'
  | 'EXPIRE';

export const DEVIS_STATUS_KEYS: Record<DevisStatus, string> = {
  BROUILLON:   'enum.devis.status.brouillon',
  EMIS:        'enum.devis.status.emis',
  NEGOCIATION: 'enum.devis.status.negociation',
  APPROUVE:    'enum.devis.status.approuve',
  PERDU:       'enum.devis.status.perdu',
  ANNULE:      'enum.devis.status.annule',
  EXPIRE:      'enum.devis.status.expire',
};

export type MetreStatus = 'BROUILLON' | 'TERMINE';

export const METRE_STATUS_KEYS: Record<MetreStatus, string> = {
  BROUILLON: 'enum.metre.status.brouillon',
  TERMINE:   'enum.metre.status.termine',
};

export type AoClientStatus =
  | 'A_ETUDIER'
  | 'EN_PREPARATION'
  | 'SOUMIS'
  | 'ATTRIBUE'
  | 'PERDU'
  | 'INFRUCTUEUX'
  | 'ANNULE';

export const AO_CLIENT_STATUS_KEYS: Record<AoClientStatus, string> = {
  A_ETUDIER:      'enum.ao_client.status.a_etudier',
  EN_PREPARATION: 'enum.ao_client.status.en_preparation',
  SOUMIS:         'enum.ao_client.status.soumis',
  ATTRIBUE:       'enum.ao_client.status.attribue',
  PERDU:          'enum.ao_client.status.perdu',
  INFRUCTUEUX:    'enum.ao_client.status.infructueux',
  ANNULE:         'enum.ao_client.status.annule',
};

export type AoClientType = 'PUBLIC' | 'PRIVE';

export const AO_CLIENT_TYPE_KEYS: Record<AoClientType, string> = {
  PUBLIC: 'enum.ao_client.type.public',
  PRIVE:  'enum.ao_client.type.prive',
};
