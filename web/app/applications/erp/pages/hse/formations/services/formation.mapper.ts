import type {
  Formation,
  FormationCreate,
  FormationUpdate,
  StatutFormation,
} from '@applications/erp/hse/models';

export interface ApiFormation {
  id: string;
  numero: string;
  titre: string;
  dateDebut: string;
  dateFin?: string;
  dureeHeures: number;
  formateur?: string;
  lieu?: string;
  nbParticipants: number;
  participants?: string[];
  habilitationCode?: string;
  attestationReference?: string;
  attestationValidite?: string;
  status: string;
  notes?: string;
}

export interface ApiFormationCreate {
  id?: string;
  titre: string;
  dateDebut: string;
  dateFin?: string;
  dureeHeures: number;
  formateur?: string;
  lieu?: string;
  nbParticipants?: number;
  participants?: string[];
  habilitationCode?: string;
  attestationReference?: string;
  attestationValidite?: string;
  status?: string;
  notes?: string;
}

export interface ApiFormationUpdate {
  titre?: string;
  dateDebut?: string;
  dateFin?: string;
  dureeHeures?: number;
  formateur?: string;
  lieu?: string;
  nbParticipants?: number;
  participants?: string[];
  habilitationCode?: string;
  attestationReference?: string;
  attestationValidite?: string;
  status?: StatutFormation;
  notes?: string;
}

export function formationToUi(row: ApiFormation): Formation {
  return {
    id: row.id,
    numero: row.numero,
    titre: row.titre,
    dateDebut: row.dateDebut,
    dateFin: row.dateFin,
    dureeHeures: row.dureeHeures,
    formateur: row.formateur,
    lieu: row.lieu,
    nbParticipants: row.nbParticipants,
    participants: row.participants,
    habilitationCode: row.habilitationCode,
    attestationReference: row.attestationReference,
    attestationValidite: row.attestationValidite,
    status: row.status as StatutFormation,
    notes: row.notes,
  };
}

export function formationCreateToApi(data: FormationCreate): ApiFormationCreate {
  return {
    titre: data.titre,
    dateDebut: data.dateDebut,
    dateFin: data.dateFin,
    dureeHeures: data.dureeHeures,
    formateur: data.formateur,
    lieu: data.lieu,
    nbParticipants: data.nbParticipants,
    participants: data.participants,
    habilitationCode: data.habilitationCode,
    attestationReference: data.attestationReference,
    attestationValidite: data.attestationValidite,
    status: data.status,
    notes: data.notes,
  };
}

export function formationUpdateToApi(data: FormationUpdate): ApiFormationUpdate {
  const payload: ApiFormationUpdate = {};
  if (data.titre !== undefined) payload.titre = data.titre;
  if (data.dateDebut !== undefined) payload.dateDebut = data.dateDebut;
  if (data.dateFin !== undefined) payload.dateFin = data.dateFin;
  if (data.dureeHeures !== undefined) payload.dureeHeures = data.dureeHeures;
  if (data.formateur !== undefined) payload.formateur = data.formateur;
  if (data.lieu !== undefined) payload.lieu = data.lieu;
  if (data.nbParticipants !== undefined) payload.nbParticipants = data.nbParticipants;
  if (data.participants !== undefined) payload.participants = data.participants;
  if (data.habilitationCode !== undefined) payload.habilitationCode = data.habilitationCode;
  if (data.attestationReference !== undefined) payload.attestationReference = data.attestationReference;
  if (data.attestationValidite !== undefined) payload.attestationValidite = data.attestationValidite;
  if (data.status !== undefined) payload.status = data.status;
  if (data.notes !== undefined) payload.notes = data.notes;
  return payload;
}
