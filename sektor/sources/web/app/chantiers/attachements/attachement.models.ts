export type AttachementStatus =
  | 'BROUILLON'
  | 'EN_ATTENTE_MOE'
  | 'SIGNE_MOE'
  | 'EN_ATTENTE_MOA'
  | 'CONTRESIGNE_MOA'
  | 'CONTESTE'
  | 'CLOS';

export type MeteoCode = 'SOLEIL' | 'NUAGEUX' | 'PLUIE' | 'VENT';

/**
 * Une ligne d'attachement — montée depuis les déclarations d'avancement de la période, jamais
 * tapée. Code, désignation, unité et prix sont lus sur le nœud (AC-12) ; seule la zone se choisit.
 */
export interface AttachementLigne {
  id: string;
  noeudId: string;
  code: string;
  designation: string;
  unite: string;
  quantitePeriode: number;
  prixUnitaireVendu?: number;
  montantHt?: number;
  zoneId?: string;
  zoneLibelle?: string;
}

export interface Attachement {
  id: string;
  numero: string;
  chantierId: string;
  chantierCode: string;
  /** AC-10 — l'attachement couvre une période, pas un jour. */
  dateDebut: string;
  dateFin: string;
  meteoCode?: MeteoCode;
  temperatureC?: number;
  effectifPresent: number;
  lignes: AttachementLigne[];
  status: AttachementStatus;
  signatureMoeDataUrl?: string;
}

/** AC-14 — le référentiel de zones du chantier, arborescent, vide par défaut. */
export interface ZoneChantier {
  id: string;
  chantierId: string;
  designation: string;
  parentZoneId?: string;
  ordre: number;
}
