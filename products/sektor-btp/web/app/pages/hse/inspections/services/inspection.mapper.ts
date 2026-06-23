import type {
  Inspection,
  InspectionCreate,
  InspectionUpdate,
} from '@applications/erp/hse/models';

export interface ApiInspection {
  id: string;
  numero: string;
  dateInspection: string;
  chantierId?: string;
  chantierCode?: string;
  inspecteurNom: string;
  organismeType?: string;
  referenceRapport?: string;
  thematique: string;
  nbObservations: number;
  nbNonConformites: number;
  noteGlobale?: number;
  status: string;
  observations?: string;
  notes?: string;
}

export interface ApiInspectionCreate {
  id?: string;
  dateInspection: string;
  chantierId?: string;
  chantierCode?: string;
  inspecteurNom: string;
  organismeType?: string;
  referenceRapport?: string;
  thematique: string;
  nbObservations?: number;
  nbNonConformites?: number;
  noteGlobale?: number;
  status?: string;
  observations?: string;
  notes?: string;
}

export function inspectionToUi(row: ApiInspection): Inspection {
  return {
    id: row.id,
    numero: row.numero,
    dateInspection: row.dateInspection,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    inspecteurNom: row.inspecteurNom,
    organismeType: row.organismeType as Inspection['organismeType'],
    referenceRapport: row.referenceRapport,
    thematique: row.thematique,
    nbObservations: row.nbObservations ?? 0,
    nbNonConformites: row.nbNonConformites ?? 0,
    noteGlobale: row.noteGlobale,
    status: row.status as Inspection['status'],
    observations: row.observations,
    notes: row.notes,
  };
}

export function inspectionCreateToApi(data: InspectionCreate): ApiInspectionCreate {
  return {
    dateInspection: data.dateInspection,
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    inspecteurNom: data.inspecteurNom,
    organismeType: data.organismeType,
    referenceRapport: data.referenceRapport,
    thematique: data.thematique,
    nbObservations: data.nbObservations,
    nbNonConformites: data.nbNonConformites,
    noteGlobale: data.noteGlobale,
    status: data.status,
    observations: data.observations,
    notes: data.notes,
  };
}

export function inspectionUpdateToApi(data: InspectionUpdate): Partial<ApiInspectionCreate> {
  const payload: Partial<ApiInspectionCreate> = {};
  if (data.dateInspection !== undefined) payload.dateInspection = data.dateInspection;
  if (data.chantierId !== undefined) payload.chantierId = data.chantierId;
  if (data.chantierCode !== undefined) payload.chantierCode = data.chantierCode;
  if (data.inspecteurNom !== undefined) payload.inspecteurNom = data.inspecteurNom;
  if (data.organismeType !== undefined) payload.organismeType = data.organismeType;
  if (data.referenceRapport !== undefined) payload.referenceRapport = data.referenceRapport;
  if (data.thematique !== undefined) payload.thematique = data.thematique;
  if (data.nbObservations !== undefined) payload.nbObservations = data.nbObservations;
  if (data.nbNonConformites !== undefined) payload.nbNonConformites = data.nbNonConformites;
  if (data.noteGlobale !== undefined) payload.noteGlobale = data.noteGlobale;
  if (data.status !== undefined) payload.status = data.status;
  if (data.observations !== undefined) payload.observations = data.observations;
  if (data.notes !== undefined) payload.notes = data.notes;
  return payload;
}
