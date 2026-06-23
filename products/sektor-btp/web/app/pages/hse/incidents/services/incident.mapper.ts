import type {
  GraviteIncident,
  Incident,
  IncidentCreate,
  IncidentUpdate,
  StatutIncident,
  TypeIncident,
} from '@applications/erp/hse/models';

export interface ApiIncident {
  id: string;
  numero: string;
  chantierId?: string;
  chantierCode?: string;
  employeId?: string;
  victimeNom?: string;
  dateIncident: string;
  heureIncident?: string;
  lieu: string;
  typeIncident: string;
  gravite: string;
  description: string;
  causes?: string;
  actionsImmediates?: string;
  planAction?: string;
  joursArret?: number;
  status: string;
  cnssDatDeclare?: boolean;
  cnssDatXmlUrl?: string;
  cnssReferenceDeclaration?: string;
  cnssDateDeclaration?: string;
  ijssMontant?: number;
  ijssPeriode?: string;
  notes?: string;
  photosUrls?: string[];
  temoins?: string[];
}

export interface ApiIncidentCreate {
  id?: string;
  chantierId?: string;
  chantierCode?: string;
  employeId?: string;
  victimeNom?: string;
  dateIncident: string;
  heureIncident?: string;
  lieu: string;
  typeIncident: string;
  gravite: string;
  description: string;
  causes?: string;
  actionsImmediates?: string;
  planAction?: string;
  joursArret?: number;
  status?: string;
  notes?: string;
  photosUrls?: string[];
  temoins?: string[];
  ijssMontant?: number;
  ijssPeriode?: string;
}

export interface ApiCnssDatResult {
  cnssDatDeclare: boolean;
  cnssDatXmlUrl: string;
  cnssReferenceDeclaration?: string;
}

const STATUS_TO_UI: Record<string, StatutIncident> = {
  OUVERT: 'DECLARE',
  INVESTIGATION: 'EN_INVESTIGATION',
  CLOS: 'CLOTURE',
};

const STATUS_TO_API: Record<StatutIncident, string> = {
  DECLARE: 'OUVERT',
  EN_INVESTIGATION: 'INVESTIGATION',
  CLOTURE: 'CLOS',
};

const TYPE_TO_UI: Record<string, TypeIncident> = {
  AT: 'AT_TRAVAIL',
  MP: 'MP',
  PRESQU_ACCIDENT: 'PRESQUE_ACCIDENT',
  ENVIRONNEMENT: 'AUTRE',
  INCIDENT: 'DOMMAGE_MATERIEL',
};

const TYPE_TO_API: Record<TypeIncident, string> = {
  AT_TRAVAIL: 'AT',
  AT_TRAJET: 'AT',
  MP: 'MP',
  PRESQUE_ACCIDENT: 'PRESQU_ACCIDENT',
  DOMMAGE_MATERIEL: 'INCIDENT',
  AUTRE: 'INCIDENT',
};

const GRAVITE_TO_UI: Record<string, GraviteIncident> = {
  LEGER: 'SANS_ARRET',
  MODERE: 'AVEC_ARRET',
  GRAVE: 'GRAVE',
  CRITIQUE: 'MORTEL',
};

const GRAVITE_TO_API: Record<GraviteIncident, string> = {
  SANS_ARRET: 'LEGER',
  AVEC_ARRET: 'MODERE',
  GRAVE: 'GRAVE',
  MORTEL: 'CRITIQUE',
};

function formatHeure(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function toUiStatus(status: string): StatutIncident {
  return STATUS_TO_UI[status] ?? (status as StatutIncident);
}

function toApiStatus(status?: StatutIncident): string | undefined {
  if (!status) return undefined;
  return STATUS_TO_API[status] ?? status;
}

function toUiType(type: string): TypeIncident | undefined {
  return TYPE_TO_UI[type] ?? (type as TypeIncident);
}

function toApiType(type?: TypeIncident): string | undefined {
  if (!type) return undefined;
  return TYPE_TO_API[type] ?? type;
}

function toUiGravite(gravite: string): GraviteIncident {
  return GRAVITE_TO_UI[gravite] ?? (gravite as GraviteIncident);
}

function toApiGravite(gravite?: GraviteIncident): string | undefined {
  if (!gravite) return undefined;
  return GRAVITE_TO_API[gravite] ?? gravite;
}

export function incidentToUi(row: ApiIncident): Incident {
  return {
    id: row.id,
    numero: row.numero,
    date: row.dateIncident,
    heure: formatHeure(row.heureIncident),
    lieu: row.lieu,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    typeIncident: toUiType(row.typeIncident),
    photosUrls: row.photosUrls,
    temoins: row.temoins,
    planAction: row.planAction,
    victimeNom: row.victimeNom,
    victimeEmployeId: row.employeId,
    cnssReferenceDeclaration: row.cnssReferenceDeclaration,
    cnssDateDeclaration: row.cnssDateDeclaration,
    gravite: toUiGravite(row.gravite),
    description: row.description,
    causes: row.causes,
    actionsImmedites: row.actionsImmediates,
    joursArret: row.joursArret,
    status: toUiStatus(row.status),
    notes: row.notes,
  };
}

function incidentPayloadBase(
  data: IncidentCreate | IncidentUpdate,
): Partial<ApiIncidentCreate> {
  return {
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    employeId: data.victimeEmployeId,
    victimeNom: data.victimeNom,
    dateIncident: data.date,
    heureIncident: data.heure ? `${data.heure}:00` : undefined,
    lieu: data.lieu,
    typeIncident: toApiType(data.typeIncident),
    gravite: toApiGravite(data.gravite),
    description: data.description,
    causes: data.causes,
    actionsImmediates: data.actionsImmedites,
    planAction: data.planAction,
    joursArret: data.joursArret,
    status: toApiStatus(data.status),
    notes: data.notes,
    photosUrls: data.photosUrls,
    temoins: data.temoins,
  };
}

export function incidentCreateToApi(data: IncidentCreate): ApiIncidentCreate {
  const payload = incidentPayloadBase(data);
  return {
    ...payload,
    dateIncident: data.date,
    lieu: data.lieu,
    typeIncident: toApiType(data.typeIncident) ?? 'INCIDENT',
    gravite: toApiGravite(data.gravite) ?? 'LEGER',
    description: data.description,
  };
}

export function incidentUpdateToApi(data: IncidentUpdate): Partial<ApiIncidentCreate> {
  const payload = incidentPayloadBase(data);
  const cleaned: Partial<ApiIncidentCreate> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      (cleaned as Record<string, unknown>)[key] = value;
    }
  }
  return cleaned;
}

export function mapStatusFilter(status?: string): string | undefined {
  if (!status) return undefined;
  return toApiStatus(status as StatutIncident) ?? status;
}

export function mapGraviteFilter(gravite?: string): string | undefined {
  if (!gravite) return undefined;
  return toApiGravite(gravite as GraviteIncident) ?? gravite;
}
