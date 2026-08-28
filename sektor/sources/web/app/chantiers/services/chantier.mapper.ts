import type { Chantier, ChantierStatus, ChantierType } from '@app/chantiers/models';

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
  dateOrdreService?: string;
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
  facturesEmisesHt?: number | string | null;
  encaissementsTtc?: number | string | null;
  cumulSituationsHt?: number | string | null;
  // ── Snapshot commercial (continuite-etude-devis-chantier AC-9/AC-11) ──
  dossierEtudeId?: string | null;
  devisId?: string | null;
  devisNumero?: string | null;
  devisVersion?: number | null;
  dateAcceptation?: string | null;
  sourceVente?: string | null;
  montantVenteInitialHt?: number | string | null;
  montantVenteActifHt?: number | string | null;
  debourseInitialHt?: number | string | null;
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
      return 'PROSPECT';
    case 'EN_PREPARATION':
      return 'EN_PREPARATION';
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
    case 'EN_PREPARATION':
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
    dateOrdreService: row.dateOrdreService,
    dateDebut,
    dateFinPrevue: row.dateFinPrevue,
    dateFinReelle: row.dateFinReelle,
    budgetHt: num(row.budgetHt ?? row.montantHt),
    tvaTaux: num(row.tvaTaux ?? row.tauxTva, 20),
    cautionGarantie: num(row.cautionGarantie ?? row.tauxRg, 7),
    avancePercue: row.avancePercue != null || row.tauxAvance != null
      ? num(row.avancePercue ?? row.tauxAvance)
      : undefined,
    avancementPercent: Math.round(num(row.avancementPercent)),
    // AC-14 — une absence reste une absence : null, jamais un faux zéro.
    facturesEmisesHt: nullableNum(row.facturesEmisesHt),
    encaissementsTtc: nullableNum(row.encaissementsTtc),
    cumulSituationsHt: nullableNum(row.cumulSituationsHt),
    dossierEtudeId: row.dossierEtudeId ?? null,
    devisId: row.devisId ?? null,
    devisNumero: row.devisNumero ?? null,
    devisVersion: row.devisVersion ?? null,
    dateAcceptation: row.dateAcceptation ?? null,
    sourceVente: row.sourceVente ?? null,
    montantVenteInitialHt: nullableNum(row.montantVenteInitialHt),
    montantVenteActifHt: nullableNum(row.montantVenteActifHt),
    debourseInitialHt: nullableNum(row.debourseInitialHt),
    status: mapBackendStatusToUi(row.status),
    lifecycleStatus: row.status,
    isActive: row.isActive ?? row.active ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Un montant absent ou null reste null — jamais converti en zéro (AC-14). */
function nullableNum(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
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
  if (input.isActive != null) body['active'] = input.isActive;
  return body;
}

/** B-CHA-09 read model payload — dictionnaire financier canonique (AC-9 à AC-14). */
export interface ApiChantierSummary {
  chantier: ApiChantier;
  budget?: {
    prevuHt?: number | string;
    reviseHt?: number | string;
    realiseHt?: number | string;
    margeHt?: number | string | null;
  };
  avancementPercent?: number | string;
  lotsCount?: number;
  openSituationsCount?: number;
  montantVenteInitialHt?: number | string | null;
  montantVenteActifHt?: number | string | null;
  debourseInitialHt?: number | string | null;
  budgetReviseHt?: number | string | null;
  margeInitialeHt?: number | string | null;
  margeInitialePct?: number | string | null;
  margeProjeteeHt?: number | string | null;
  margeProjeteePct?: number | string | null;
  sourceVente?: string | null;
  status?: string | null;
}

export interface ChantierSummary {
  chantier: Chantier;
  budget: {
    prevuHt: number;
    reviseHt: number;
    realiseHt: number;
    margeHt: number | null;
  };
  avancementPercent: number;
  lotsCount: number;
  openSituationsCount: number;
  montantVenteInitialHt: number | null;
  montantVenteActifHt: number | null;
  debourseInitialHt: number | null;
  budgetReviseHt: number | null;
  margeInitialeHt: number | null;
  margeInitialePct: number | null;
  margeProjeteeHt: number | null;
  margeProjeteePct: number | null;
  sourceVente: string | null;
  status: string | null;
}

export function chantierSummaryToUi(row: ApiChantierSummary): ChantierSummary {
  const budget = row.budget ?? {};
  return {
    chantier: chantierToUi(row.chantier),
    budget: {
      prevuHt: num(budget.prevuHt),
      reviseHt: num(budget.reviseHt),
      realiseHt: num(budget.realiseHt),
      margeHt: nullableNum(budget.margeHt),
    },
    avancementPercent: Math.round(num(row.avancementPercent)),
    lotsCount: row.lotsCount ?? 0,
    openSituationsCount: row.openSituationsCount ?? 0,
    montantVenteInitialHt: nullableNum(row.montantVenteInitialHt),
    montantVenteActifHt: nullableNum(row.montantVenteActifHt),
    debourseInitialHt: nullableNum(row.debourseInitialHt),
    budgetReviseHt: nullableNum(row.budgetReviseHt),
    margeInitialeHt: nullableNum(row.margeInitialeHt),
    margeInitialePct: nullableNum(row.margeInitialePct),
    margeProjeteeHt: nullableNum(row.margeProjeteeHt),
    margeProjeteePct: nullableNum(row.margeProjeteePct),
    sourceVente: row.sourceVente ?? null,
    status: row.status ?? null,
  };
}
