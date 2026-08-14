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

// --- merged from pages/ (SEKTOR-85) ---

// ─── DUER ──────────────────────────────────────────────────────────────
export type DuerStatus = 'BROUILLON' | 'VALIDE' | 'REVISION';

/** Échelle 1–4 pour matrice risque (démo DUER, lecture proba × gravité). */
export type DuerEchelle124 = 1 | 2 | 3 | 4;

export interface DuerRisqueMatriceRow {
  id: string;
  libelle: string;
  codeActivite?: string;
  probabilite: DuerEchelle124;
  gravite: DuerEchelle124;
}

export interface Duer {
  id: string;
  numero: string;                    // DUER-2026-001
  chantierId: string;
  chantierCode: string;
  chantierName: string;
  version: string;                   // v1.0, v1.1...
  dateRevision: string;              // ISO date
  auteurId: string;
  auteurNom: string;
  risquesIdentifies: number;         // count
  actionsCorrectives: number;        // count
  observations?: string;
  status: DuerStatus;
  /** Lignes matrice risque × probabilité × gravité (démo). */
  matriceRisques?: DuerRisqueMatriceRow[];
}

// ─── PPSPS / PHS (sections type art. R4532-65 — usage démo MA) ─────────
export type PpspsStatus = 'BROUILLON' | 'VALIDE' | 'REVISION' | 'APPLICATIF' | 'ARCHIVE';

export interface PpspsSection {
  numero: string;
  titre: string;
  contenu: string;
  risquesAssocies?: string[];
  procedures?: string[];
}

export interface Ppsps {
  id: string;
  numero: string;                    // PPSPS-CH-2025-001
  chantierId: string;
  chantierCode: string;
  chantierName: string;
  coordonnateurSpsNom: string;
  coordonnateurSpsTel?: string;
  date: string;                      // ISO date
  mesuresCollectives: string;
  effectifsMaxJour?: number;
  hommesJourEstimes?: number;
  observations?: string;
  status: PpspsStatus;
  /** Version document (historique P2 — compteur affiché). */
  version?: number;
  sections?: PpspsSection[];
  documentUrl?: string;
}

/** PHS — plan chapeau société (avant PPSPS chantier). */
export interface PhsDocument {
  id: string;
  numero: string;
  version: number;
  dateRedaction: string;
  redacteurNom: string;
  status: PpspsStatus;
  sections: PpspsSection[];
  documentUrl?: string;
}

// ─── Visites médicales ────────────────────────────────────────────────
export type TypeVisite = 'EMBAUCHE' | 'PERIODIQUE' | 'REPRISE';
export type AptitudeVisite = 'APTE' | 'INAPTE' | 'AVEC_RESTRICTION';

export interface VisiteMedicale {
  id: string;
  employeId: string;
  employeMatricule: string;
  employeNom: string;
  posteOccupe: string;
  type: TypeVisite;
  date: string;                      // date réalisée
  aptitude: AptitudeVisite;
  medecinNom: string;
  restrictions?: string;
  prochaineEcheance: string;         // ISO date
}

// ─── Registres légaux ────────────────────────────────────────────────
export type RegistreLegalKind = 'AT' | 'MP' | 'DT' | 'CHS';

export interface RegistreLegalEntry {
  id: string;
  registre: RegistreLegalKind;       // discriminator
  numero: string;                    // ATR-2026-001, MPR-2026-001, ...
  date: string;                      // ISO date
  reference?: string;                // n° dossier CNSS / DT inspection / PV CHS
  chantierId?: string;
  chantierCode?: string;
  employeNom?: string;               // pour AT / MP
  cnssMatricule?: string;            // pour AT / MP
  description: string;               // description courte
  /** AT */ joursArret?: number;
  /** AT */ partieDuCorps?: string;
  /** MP */ tableauMP?: string;      // ex. "Tableau MA n°25"
  /** DT */ effectif?: number;
  /** DT */ dureeJours?: number;
  /** CHS */ presents?: number;
  /** CHS */ decisions?: string;
  observations?: string;
}

// ─── HSE extended state ────────────────────────────────────────────────
export interface HseExtendedState {
  duer: Duer[];
  ppsps: Ppsps[];
  phs: PhsDocument[];
  visitesMedicales: VisiteMedicale[];
  registres: RegistreLegalEntry[];
}

/** Sections types PPSPS / PHS (trame démo — édition markdown). */
export const PPSPS_SECTION_TEMPLATE_FR: PpspsSection[] = [
  { numero: '1', titre: 'Renseignements administratifs', contenu: '' },
  { numero: '2', titre: 'Description de l\'ouvrage', contenu: '' },
  { numero: '3', titre: 'Coordination de la prévention', contenu: '' },
  { numero: '4', titre: 'Organisation générale — prévention', contenu: '' },
  { numero: '5', titre: 'Mesures techniques', contenu: '' },
  { numero: '6', titre: 'Évaluation des risques & DUER', contenu: '' },
  { numero: '7', titre: 'Premiers secours & organisation des secours', contenu: '' },
  { numero: '8', titre: 'Coactivité', contenu: '' },
];
