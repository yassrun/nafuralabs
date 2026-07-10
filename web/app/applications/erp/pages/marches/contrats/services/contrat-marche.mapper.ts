import type { Marche, MarcheNature, MarcheStatus, MarcheType } from '../../models';

export interface ApiContratMarche {
  id: string;
  numero: string;
  reference?: string;
  intitule: string;
  chantierId: string;
  chantierCode?: string;
  chantierNom?: string;
  clientId: string;
  clientNom?: string;
  typeMarche: string;
  typeCcagT?: string;
  natureMarche?: string;
  dateNotification?: string;
  dateDemarrage?: string;
  dureeMois?: number;
  montantHt: number | string;
  tauxTva?: number | string;
  tauxRg?: number | string;
  tauxRas?: number | string;
  tauxAvance?: number | string;
  status: string;
}

export interface ApiBpuLigne {
  id: string;
  contratMarcheId?: string;
  contratId?: string;
  posteCode: string;
  designation: string;
  unite: string;
  quantite: number | string;
  prixUnitaireHt: number | string;
  montantHt?: number | string;
  ordre?: number;
}

const TYPE_TO_UI: Record<string, MarcheType> = {
  FORFAITAIRE: 'FORFAIT',
  FORFAIT: 'FORFAIT',
  BPU: 'BPU',
  METRE_QUANTITATIF: 'REGIE',
  REGIE: 'REGIE',
  MIXTE: 'MIXTE',
};

const TYPE_TO_API: Record<MarcheType, string> = {
  FORFAIT: 'FORFAITAIRE',
  BPU: 'BPU',
  REGIE: 'METRE_QUANTITATIF',
  MIXTE: 'MIXTE',
};

const STATUS_TO_UI: Record<string, MarcheStatus> = {
  BROUILLON: 'BROUILLON',
  NOTIFIE: 'SIGNE',
  SIGNE: 'SIGNE',
  EN_COURS: 'EN_EXECUTION',
  EN_EXECUTION: 'EN_EXECUTION',
  RECEPTION_PROVISOIRE: 'RECEPTION_PROVISOIRE',
  RECEPTION_DEFINITIVE: 'RECEPTION_DEFINITIVE',
  CLOS: 'CLOTURE',
  CLOTURE: 'CLOTURE',
};

const STATUS_TO_API: Record<MarcheStatus, string> = {
  BROUILLON: 'BROUILLON',
  SIGNE: 'NOTIFIE',
  EN_EXECUTION: 'EN_COURS',
  RECEPTION_PROVISOIRE: 'RECEPTION_PROVISOIRE',
  RECEPTION_DEFINITIVE: 'RECEPTION_DEFINITIVE',
  CLOTURE: 'CLOS',
  RESILIE: 'CLOS',
};

function num(v: number | string | undefined | null, fallback = 0): number {
  if (v == null) return fallback;
  return typeof v === 'number' ? v : Number(v);
}

export function mapUiStatusToBackend(status: MarcheStatus): string {
  return STATUS_TO_API[status] ?? status;
}

export function contratMarcheToUi(row: ApiContratMarche): Marche {
  const montantInitialHt = num(row.montantHt);
  return {
    id: row.id,
    numero: row.numero,
    reference: row.reference,
    intitule: row.intitule,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode ?? row.chantierId,
    chantierNom: row.chantierNom ?? '',
    clientId: row.clientId,
    clientNom: row.clientNom ?? '',
    type: TYPE_TO_UI[row.typeMarche] ?? 'FORFAIT',
    nature: (row.natureMarche as MarcheNature) ?? 'PRIVE_GRAND_COMPTE',
    montantInitialHt,
    tvaTaux: num(row.tauxTva, 20),
    retenueGarantieTaux: num(row.tauxRg, 7),
    retenueSourceTaux: num(row.tauxRas, 0),
    avanceForfaitairePercent: row.tauxAvance != null ? num(row.tauxAvance) : undefined,
    delaiExecutionMois: row.dureeMois ?? 0,
    dateOrdreService: row.dateDemarrage,
    status: STATUS_TO_UI[row.status] ?? 'BROUILLON',
    montantAvenantsHt: 0,
    montantTotalHt: montantInitialHt,
    avancementPercent: 0,
    cumulFactureHt: 0,
    cumulEncaisseHt: 0,
  };
}

export function contratMarcheCreateToApi(data: Partial<Marche>): Record<string, unknown> {
  return {
    id: data.id,
    numero: data.numero,
    reference: data.reference,
    intitule: data.intitule,
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    chantierNom: data.chantierNom,
    clientId: data.clientId,
    clientNom: data.clientNom,
    typeMarche: data.type ? TYPE_TO_API[data.type] : undefined,
    natureMarche: data.nature,
    dateDemarrage: data.dateOrdreService,
    dureeMois: data.delaiExecutionMois,
    montantHt: data.montantInitialHt,
    tauxTva: data.tvaTaux,
    tauxRg: data.retenueGarantieTaux,
    tauxRas: data.retenueSourceTaux,
    tauxAvance: data.avanceForfaitairePercent,
    status: data.status ? mapUiStatusToBackend(data.status) : undefined,
  };
}

export function contratMarcheUpdateToApi(data: Partial<Marche>): Record<string, unknown> {
  const body = contratMarcheCreateToApi(data);
  delete body['id'];
  delete body['numero'];
  return body;
}
