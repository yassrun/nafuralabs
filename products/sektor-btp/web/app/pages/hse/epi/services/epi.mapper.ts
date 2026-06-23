import type { EpiCategorie, EpiRecord, EpiStatus } from '../epi.models';

export interface ApiEpiDotation {
  id: string;
  reference: string;
  designation: string;
  categorie: string;
  marque: string;
  normeCe?: string;
  employeId: string;
  employeNom: string;
  chantierId?: string;
  chantierCode?: string;
  dateAttribution: string;
  dateExpiration?: string;
  prixUnitaire: number;
  status: string;
  dateDerniereVerification?: string;
  prochaineVerification?: string;
}

export function epiToUi(row: ApiEpiDotation): EpiRecord {
  return {
    id: row.id,
    reference: row.reference,
    designation: row.designation,
    categorie: row.categorie as EpiCategorie,
    marque: row.marque,
    normeCE: row.normeCe,
    employeId: row.employeId,
    employeNom: row.employeNom,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    dateAttribution: row.dateAttribution,
    dateExpiration: row.dateExpiration,
    prixUnitaire: Number(row.prixUnitaire ?? 0),
    status: row.status as EpiStatus,
    dateDerniereVerification: row.dateDerniereVerification,
    prochaineVerification: row.prochaineVerification,
  };
}
