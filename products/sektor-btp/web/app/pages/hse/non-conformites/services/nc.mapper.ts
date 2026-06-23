import type {
  NonConformite,
  NonConformiteCreate,
  NonConformiteUpdate,
  StatutNC,
  TypeNonConformite,
} from '@applications/erp/hse/models';

export interface ApiNonConformite {
  id: string;
  numero: string;
  dateNc: string;
  chantierId?: string;
  chantierCode?: string;
  zoneChantier?: string;
  typeNc: string;
  description: string;
  causesRacines?: string;
  actionCorrective?: string;
  actionPreventive?: string;
  verificationEfficacite?: string;
  dateVerificationEfficacite?: string;
  responsableId?: string;
  responsableNom?: string;
  dateEcheance?: string;
  sourceInspectionId?: string;
  sourceInspectionNumero?: string;
  cnssOuInspectionReference?: string;
  registreLegalNumero?: string;
  status: string;
  notes?: string;
}

export interface ApiNonConformiteCreate {
  id?: string;
  dateNc: string;
  chantierId?: string;
  chantierCode?: string;
  zoneChantier?: string;
  typeNc: string;
  description: string;
  causesRacines?: string;
  actionCorrective?: string;
  actionPreventive?: string;
  verificationEfficacite?: string;
  dateVerificationEfficacite?: string;
  responsableId?: string;
  responsableNom?: string;
  dateEcheance?: string;
  sourceInspectionId?: string;
  sourceInspectionNumero?: string;
  cnssOuInspectionReference?: string;
  registreLegalNumero?: string;
  status?: string;
  notes?: string;
}

export interface ApiCapaAction {
  id: string;
  typeCapa: string;
  description: string;
  responsableId?: string;
  responsableNom?: string;
  dateEcheance?: string;
  status: string;
}

const STATUS_TO_UI: Record<string, StatutNC> = {
  OUVERTE: 'OUVERTE',
  ASSIGNEE: 'EN_COURS',
  EN_TRAITEMENT: 'EN_COURS',
  VERIFIEE: 'VERIFIEE',
  CLOTUREE: 'CLOTUREE',
};

const STATUS_TO_API: Record<StatutNC, string> = {
  OUVERTE: 'OUVERTE',
  EN_COURS: 'EN_TRAITEMENT',
  VERIFIEE: 'VERIFIEE',
  CLOTUREE: 'CLOTUREE',
};

function toUiStatus(status: string): StatutNC {
  return STATUS_TO_UI[status] ?? (status as StatutNC);
}

function toApiStatus(status?: StatutNC): string | undefined {
  if (!status) return undefined;
  return STATUS_TO_API[status] ?? status;
}

export function ncToUi(row: ApiNonConformite): NonConformite {
  return {
    id: row.id,
    numero: row.numero,
    date: row.dateNc,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    zoneChantier: row.zoneChantier,
    type: row.typeNc as TypeNonConformite,
    description: row.description,
    causesRacines: row.causesRacines,
    actionCorrective: row.actionCorrective,
    actionPreventive: row.actionPreventive,
    verificationEfficacite: row.verificationEfficacite,
    dateVerificationEfficacite: row.dateVerificationEfficacite,
    responsableId: row.responsableId,
    responsableNom: row.responsableNom,
    dateEcheance: row.dateEcheance,
    sourceInspectionId: row.sourceInspectionId,
    sourceInspectionNumero: row.sourceInspectionNumero,
    cnssOuInspectionReference: row.cnssOuInspectionReference,
    registreLegalNumero: row.registreLegalNumero,
    status: toUiStatus(row.status),
    notes: row.notes,
  };
}

function ncPayloadBase(data: NonConformiteCreate | NonConformiteUpdate): Partial<ApiNonConformiteCreate> {
  return {
    dateNc: data.date,
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    zoneChantier: data.zoneChantier,
    typeNc: data.type,
    description: data.description,
    causesRacines: data.causesRacines,
    actionCorrective: data.actionCorrective,
    actionPreventive: data.actionPreventive,
    verificationEfficacite: data.verificationEfficacite,
    dateVerificationEfficacite: data.dateVerificationEfficacite,
    responsableId: data.responsableId,
    responsableNom: data.responsableNom,
    dateEcheance: data.dateEcheance,
    sourceInspectionId: data.sourceInspectionId,
    sourceInspectionNumero: data.sourceInspectionNumero,
    cnssOuInspectionReference: data.cnssOuInspectionReference,
    registreLegalNumero: data.registreLegalNumero,
    status: toApiStatus(data.status),
    notes: data.notes,
  };
}

export function ncCreateToApi(data: NonConformiteCreate): ApiNonConformiteCreate {
  const payload = ncPayloadBase(data);
  return {
    ...payload,
    dateNc: data.date,
    typeNc: data.type,
    description: data.description,
  };
}

export function ncUpdateToApi(data: NonConformiteUpdate): Partial<ApiNonConformiteCreate> {
  const payload = ncPayloadBase(data);
  const cleaned: Partial<ApiNonConformiteCreate> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      (cleaned as Record<string, unknown>)[key] = value;
    }
  }
  return cleaned;
}

export function mapNcStatusFilter(status?: string): string | undefined {
  if (!status) return undefined;
  if (status === 'EN_COURS') return 'EN_COURS';
  return toApiStatus(status as StatutNC) ?? status;
}
