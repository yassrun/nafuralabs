/**
 * i18n keys for HSE-module statuses & types. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR maps in:
 *   - duer/duer-listing.page.ts → STATUS_LABELS
 *   - ppsps/ppsps-listing.page.ts → STATUS_LABELS
 *   - incidents/config/listing/columns.ts → STATUS_LABELS, TYPE_LABELS
 *   - inspections/config/listing/columns.ts → STATUS_LABELS
 *   - formations/config/listing/columns.ts → STATUS_LABELS
 *   - non-conformites/config/listing/columns.ts → STATUS_LABELS, TYPE_LABELS
 *   - epi/epi-mock.data.ts → STATUS_LABELS, CAT_LABELS
 */

export type DuerStatus = 'BROUILLON' | 'VALIDE' | 'REVISION';
export const DUER_STATUS_KEYS: Record<DuerStatus, string> = {
  BROUILLON: 'enum.duer.status.brouillon',
  VALIDE:    'enum.duer.status.valide',
  REVISION:  'enum.duer.status.revision',
};

export type PpspsStatus = 'BROUILLON' | 'VALIDE' | 'REVISION' | 'APPLICATIF' | 'ARCHIVE';
export const PPSPS_STATUS_KEYS: Record<PpspsStatus, string> = {
  BROUILLON:  'enum.ppsps.status.brouillon',
  VALIDE:     'enum.ppsps.status.valide',
  REVISION:   'enum.ppsps.status.revision',
  APPLICATIF: 'enum.ppsps.status.applicatif',
  ARCHIVE:    'enum.ppsps.status.archive',
};

export type IncidentStatus = 'DECLARE' | 'EN_INVESTIGATION' | 'CLOTURE';
export const INCIDENT_STATUS_KEYS: Record<IncidentStatus, string> = {
  DECLARE:           'enum.incident.status.declare',
  EN_INVESTIGATION:  'enum.incident.status.en_investigation',
  CLOTURE:           'enum.incident.status.cloture',
};

export type IncidentType =
  | 'AT_TRAVAIL'
  | 'AT_TRAJET'
  | 'PRESQUE_ACCIDENT'
  | 'DOMMAGE_MATERIEL'
  | 'MP'
  | 'AUTRE';
export const INCIDENT_TYPE_KEYS: Record<IncidentType, string> = {
  AT_TRAVAIL:       'enum.incident.type.at_travail',
  AT_TRAJET:        'enum.incident.type.at_trajet',
  PRESQUE_ACCIDENT: 'enum.incident.type.presque_accident',
  DOMMAGE_MATERIEL: 'enum.incident.type.dommage_materiel',
  MP:               'enum.incident.type.mp',
  AUTRE:            'enum.incident.type.autre',
};

export type InspectionStatus = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export const INSPECTION_STATUS_KEYS: Record<InspectionStatus, string> = {
  PLANIFIEE: 'enum.inspection.status.planifiee',
  EN_COURS:  'enum.inspection.status.en_cours',
  TERMINEE:  'enum.inspection.status.terminee',
  ANNULEE:   'enum.inspection.status.annulee',
};

export type FormationStatus = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export const FORMATION_STATUS_KEYS: Record<FormationStatus, string> = {
  PLANIFIEE: 'enum.formation.status.planifiee',
  EN_COURS:  'enum.formation.status.en_cours',
  TERMINEE:  'enum.formation.status.terminee',
  ANNULEE:   'enum.formation.status.annulee',
};

export type NonConformiteStatus = 'OUVERTE' | 'EN_COURS' | 'VERIFIEE' | 'CLOTUREE';
export const NC_STATUS_KEYS: Record<NonConformiteStatus, string> = {
  OUVERTE:  'enum.nc.status.ouverte',
  EN_COURS: 'enum.nc.status.en_cours',
  VERIFIEE: 'enum.nc.status.verifiee',
  CLOTUREE: 'enum.nc.status.cloturee',
};

export type NonConformiteType = 'SECURITE' | 'QUALITE' | 'ENVIRONNEMENT' | 'REGLEMENTAIRE';
export const NC_TYPE_KEYS: Record<NonConformiteType, string> = {
  SECURITE:      'enum.nc.type.securite',
  QUALITE:       'enum.nc.type.qualite',
  ENVIRONNEMENT: 'enum.nc.type.environnement',
  REGLEMENTAIRE: 'enum.nc.type.reglementaire',
};

export type EpiStatus = 'OK' | 'A_RENOUVELER' | 'EXPIRE' | 'PERDU';
export const EPI_STATUS_KEYS: Record<EpiStatus, string> = {
  OK:           'enum.epi.status.ok',
  A_RENOUVELER: 'enum.epi.status.a_renouveler',
  EXPIRE:       'enum.epi.status.expire',
  PERDU:        'enum.epi.status.perdu',
};

export type EpiCategorie =
  | 'TETE'
  | 'YEUX'
  | 'PIEDS'
  | 'MAINS'
  | 'CORPS'
  | 'RESPIRATION'
  | 'AUDITION'
  | 'CHUTE';
export const EPI_CATEGORIE_KEYS: Record<EpiCategorie, string> = {
  TETE:        'enum.epi.cat.tete',
  YEUX:        'enum.epi.cat.yeux',
  PIEDS:       'enum.epi.cat.pieds',
  MAINS:       'enum.epi.cat.mains',
  CORPS:       'enum.epi.cat.corps',
  RESPIRATION: 'enum.epi.cat.respiration',
  AUDITION:    'enum.epi.cat.audition',
  CHUTE:       'enum.epi.cat.chute',
};
