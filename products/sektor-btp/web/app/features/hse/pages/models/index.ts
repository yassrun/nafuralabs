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
