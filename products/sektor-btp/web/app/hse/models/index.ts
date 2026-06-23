export type GraviteIncident = 'SANS_ARRET' | 'AVEC_ARRET' | 'GRAVE' | 'MORTEL';
export type StatutIncident = 'DECLARE' | 'EN_INVESTIGATION' | 'CLOTURE';

/** Typologie registre AT / presqu'AT / MP (déclaration CNSS DAT si AT* ou MP). */
export type TypeIncident =
  | 'AT_TRAVAIL'
  | 'AT_TRAJET'
  | 'PRESQUE_ACCIDENT'
  | 'DOMMAGE_MATERIEL'
  | 'MP'
  | 'AUTRE';
export type TypeNonConformite = 'SECURITE' | 'QUALITE' | 'ENVIRONNEMENT' | 'REGLEMENTAIRE';
export type StatutNC = 'OUVERTE' | 'EN_COURS' | 'VERIFIEE' | 'CLOTUREE';
export type StatutInspection = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export type StatutFormation = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Incident {
  id: string; numero: string;
  date: string; heure?: string;
  lieu: string; chantierId?: string; chantierCode?: string;
  typeIncident?: TypeIncident;
  photosUrls?: string[];
  temoins?: string[];
  planAction?: string;
  victimeNom?: string; victimeEmployeId?: string;
  /** CNSS — n° affiliation victime / déclarant */
  cnssMatriculeVictime?: string;
  /** CNSS — déclaration AT / référence dossier (DA) */
  cnssReferenceDeclaration?: string;
  /** CNSS — date envoi déclaration (ISO) */
  cnssDateDeclaration?: string;
  gravite: GraviteIncident;
  description: string;
  causes?: string;
  actionsImmedites?: string;
  joursArret?: number;
  status: StatutIncident;
  notes?: string;
}
export interface IncidentListItem extends Incident {}
export type IncidentCreate = Omit<Incident, 'id' | 'numero'>;
export type IncidentUpdate = Partial<IncidentCreate>;

export interface NonConformite {
  id: string; numero: string;
  date: string; chantierId?: string; chantierCode?: string;
  zoneChantier?: string;
  type: TypeNonConformite;
  description: string;
  causesRacines?: string;
  actionCorrective?: string;
  actionPreventive?: string;
  verificationEfficacite?: string;
  dateVerificationEfficacite?: string;
  responsableId?: string; responsableNom?: string;
  dateEcheance?: string;
  sourceInspectionId?: string;
  sourceInspectionNumero?: string;
  /** CNSS / inspection du travail — référence PV ou suite réglementaire */
  cnssOuInspectionReference?: string;
  /** CNSS — lien avec registre légal AT/MP (n° interne) */
  registreLegalNumero?: string;
  status: StatutNC;
  notes?: string;
}
export interface NonConformiteListItem extends NonConformite {}
export type NonConformiteCreate = Omit<NonConformite, 'id' | 'numero'>;
export type NonConformiteUpdate = Partial<NonConformiteCreate>;

export interface Inspection {
  id: string; numero: string;
  dateInspection: string;
  chantierId?: string; chantierCode?: string;
  inspecteurNom: string;
  /** Organisme : IT / CNSS / MOA / préventionniste */
  organismeType?: 'INSPECTION_TRAVAIL' | 'CNSS_PREVENTION' | 'MOA' | 'INTERNE' | 'AUTRE';
  /** Référence convocation / rapport officiel */
  referenceRapport?: string;
  thematique: string;
  nbObservations: number;
  nbNonConformites: number;
  noteGlobale?: number;
  status: StatutInspection;
  observations?: string;
  notes?: string;
}
export interface InspectionListItem extends Inspection {}
export type InspectionCreate = Omit<Inspection, 'id' | 'numero'>;
export type InspectionUpdate = Partial<InspectionCreate>;

export interface Formation {
  id: string; numero: string;
  titre: string;
  dateDebut: string; dateFin?: string;
  dureeHeures: number;
  formateur?: string;
  lieu?: string;
  nbParticipants: number;
  participants?: string[];
  /** Habilitations SST / CACES / électricien — code attest. CNSS / OPCO */
  habilitationCode?: string;
  /** N° attestation / session agréée */
  attestationReference?: string;
  /** Date fin validité attestation (ISO) */
  attestationValidite?: string;
  status: StatutFormation;
  notes?: string;
}
export interface FormationListItem extends Formation {}
export type FormationCreate = Omit<Formation, 'id' | 'numero'>;
export type FormationUpdate = Partial<FormationCreate>;

export interface HseState {
  incidents: Incident[];
  nonConformites: NonConformite[];
  inspections: Inspection[];
  formations: Formation[];
}
