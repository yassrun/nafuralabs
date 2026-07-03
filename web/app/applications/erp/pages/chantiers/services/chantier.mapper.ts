import type { Chantier, ChantierStatus, ChantierType } from '@applications/erp/chantiers/models';

/** Backend aggregate payload (B-CHA-01). */
export interface ApiChantier {
  id: string;
  code: string;
  name?: string;
  label?: string;
  description?: string;
  type?: string;
  chantierType?: string;
  clientId?: string;
  clientName?: string;
  ville?: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  marcheReference?: string;
  marcheNumero?: string;
  dateDebut?: string;
  dateDemarrage?: string;
  dateFinPrevue?: string;
  dateFinReelle?: string;
  budgetHt?: number | string;
  montantHt?: number | string;
  tvaTaux?: number | string;
  tauxTva?: number | string;
  cautionGarantie?: number | string;
  tauxRg?: number | string;
  avancePercue?: number | string;
  tauxAvance?: number | string;
  avancementPercent?: number | string;
  status?: string;
  chefChantierName?: string;
  conducteurTravauxName?: string;
  ingenieurName?: string;
  isActive?: boolean;
  active?: boolean;
  facturesEmisesHt?: number | string;
  encaissementsTtc?: number | string;
  cumulSituationsHt?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

function num(value: number | string | undefined | null, fallback = 0): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapBackendStatusToUi(status: string | undefined): ChantierStatus {
  switch ((status ?? '').toUpperCase()) {
    case 'BROUILLON':
    case 'EN_PREPARATION':
      return 'PROSPECT';
    case 'EN_COURS':
      return 'EN_COURS';
    case 'SUSPENDU':
      return 'SUSPENDU';
    case 'RECEPTIONNE_PROVISOIRE':
    case 'RECEPTIONNE_DEFINITIF':
      return 'RECEPTIONNE';
    case 'CLOS':
      return 'CLOTURE';
    default:
      return 'EN_COURS';
  }
}

export function mapUiStatusToBackend(status: ChantierStatus | string | undefined): string {
  switch (status) {
    case 'PROSPECT':
      return 'EN_PREPARATION';
    case 'RECEPTIONNE':
      return 'RECEPTIONNE_PROVISOIRE';
    case 'CLOTURE':
      return 'CLOS';
    case 'TERMINE':
      return 'EN_COURS';
    case 'ANNULE':
      return 'CLOS';
    default:
      return status ?? 'EN_COURS';
  }
}

export function chantierToUi(row: ApiChantier): Chantier {
  const dateDebut = row.dateDebut ?? row.dateDemarrage ?? '';
  return {
    id: row.id,
    code: row.code,
    name: row.name ?? row.label ?? row.code,
    description: row.description,
    type: (row.type ?? row.chantierType ?? 'BATIMENT') as ChantierType,
    clientId: row.clientId ?? '',
    clientName: row.clientName,
    ville: row.ville ?? '',
    adresse: row.adresse,
    latitude: row.latitude,
    longitude: row.longitude,
    marcheReference: row.marcheReference ?? row.marcheNumero,
    dateDebut,
    dateFinPrevue: row.dateFinPrevue ?? dateDebut,
    dateFinReelle: row.dateFinReelle,
    budgetHt: num(row.budgetHt ?? row.montantHt),
    tvaTaux: num(row.tvaTaux ?? row.tauxTva, 20),
    cautionGarantie: num(row.cautionGarantie ?? row.tauxRg, 7),
    avancePercue: row.avancePercue != null || row.tauxAvance != null
      ? num(row.avancePercue ?? row.tauxAvance)
      : undefined,
    avancementPercent: Math.round(num(row.avancementPercent)),
    facturesEmisesHt: num(row.facturesEmisesHt),
    encaissementsTtc: num(row.encaissementsTtc),
    cumulSituationsHt: num(row.cumulSituationsHt),
    status: mapBackendStatusToUi(row.status),
    isActive: row.isActive ?? row.active ?? true,
    chefChantierName: row.chefChantierName,
    conducteurTravauxName: row.conducteurTravauxName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function chantierCreateToApi(
  input: Partial<Chantier> & { name: string; clientId: string; ville: string },
): Record<string, unknown> {
  return {
    id: input.id,
    code: input.code,
    label: input.name,
    description: input.description,
    chantierType: input.type ?? 'BATIMENT',
    clientId: input.clientId,
    clientName: input.clientName,
    ville: input.ville,
    adresse: input.adresse,
    latitude: input.latitude,
    longitude: input.longitude,
    marcheNumero: input.marcheReference,
    dateDemarrage: input.dateDebut,
    dateFinPrevue: input.dateFinPrevue,
    montantHt: input.budgetHt ?? 0,
    tauxTva: input.tvaTaux ?? 20,
    tauxRg: input.cautionGarantie ?? 7,
    tauxAvance: input.avancePercue,
    avancementPercent: input.avancementPercent ?? 0,
    status: mapUiStatusToBackend(input.status),
    chefChantierName: input.chefChantierName,
    conducteurTravauxName: input.conducteurTravauxName,
    active: input.isActive ?? true,
  };
}

export function chantierUpdateToApi(input: Partial<Chantier>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.name != null) body['label'] = input.name;
  if (input.description != null) body['description'] = input.description;
  if (input.type != null) body['chantierType'] = input.type;
  if (input.clientId != null) body['clientId'] = input.clientId;
  if (input.marcheReference != null) body['marcheNumero'] = input.marcheReference;
  if (input.ville != null) body['ville'] = input.ville;
  if (input.adresse != null) body['adresse'] = input.adresse;
  if (input.dateDebut != null) body['dateDemarrage'] = input.dateDebut;
  if (input.dateFinPrevue != null) body['dateFinPrevue'] = input.dateFinPrevue;
  if (input.budgetHt != null) body['montantHt'] = input.budgetHt;
  if (input.tvaTaux != null) body['tauxTva'] = input.tvaTaux;
  if (input.cautionGarantie != null) body['tauxRg'] = input.cautionGarantie;
  if (input.avancementPercent != null) body['avancementPercent'] = input.avancementPercent;
  if (input.status != null) body['status'] = mapUiStatusToBackend(input.status);
  if (input.chefChantierName != null) body['chefChantierName'] = input.chefChantierName;
  if (input.conducteurTravauxName != null) body['conducteurTravauxName'] = input.conducteurTravauxName;
  if (input.isActive != null) body['active'] = input.isActive;
  return body;
}

/** B-CHA-09 read model payload. */
export interface ApiChantierSummary {
  chantier: ApiChantier;
  budget?: {
    prevuHt?: number | string;
    reviseHt?: number | string;
    realiseHt?: number | string;
    margeHt?: number | string;
  };
  avancementPercent?: number | string;
  lotsCount?: number;
  openSituationsCount?: number;
}

export interface ChantierSummary {
  chantier: Chantier;
  budget: {
    prevuHt: number;
    reviseHt: number;
    realiseHt: number;
    margeHt: number;
  };
  avancementPercent: number;
  lotsCount: number;
  openSituationsCount: number;
}

export function chantierSummaryToUi(row: ApiChantierSummary): ChantierSummary {
  const budget = row.budget ?? {};
  return {
    chantier: chantierToUi(row.chantier),
    budget: {
      prevuHt: num(budget.prevuHt),
      reviseHt: num(budget.reviseHt),
      realiseHt: num(budget.realiseHt),
      margeHt: num(budget.margeHt),
    },
    avancementPercent: Math.round(num(row.avancementPercent)),
    lotsCount: row.lotsCount ?? 0,
    openSituationsCount: row.openSituationsCount ?? 0,
  };
}
