/**
 * i18n keys for Visite médicale Aptitude. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/hse/visites-medicales/visites-medicales-listing.page.ts → APTITUDE_LABELS, TYPE_LABELS
 */

export type AptitudeVisite = 'APTE' | 'INAPTE' | 'AVEC_RESTRICTION';

export const APTITUDE_KEYS: Record<AptitudeVisite, string> = {
  APTE:             'enum.aptitude.apte',
  INAPTE:           'enum.aptitude.inapte',
  AVEC_RESTRICTION: 'enum.aptitude.avec_restriction',
};

export type TypeVisiteMedicale = 'EMBAUCHE' | 'PERIODIQUE' | 'REPRISE';

export const TYPE_VISITE_KEYS: Record<TypeVisiteMedicale, string> = {
  EMBAUCHE:   'enum.type_visite.embauche',
  PERIODIQUE: 'enum.type_visite.periodique',
  REPRISE:    'enum.type_visite.reprise',
};
