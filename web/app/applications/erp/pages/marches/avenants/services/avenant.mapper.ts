import type { Avenant, AvenantStatus, AvenantType } from '../../models';

export interface ApiAvenant {
  id: string;
  numero: string;
  contratMarcheId: string;
  marcheNumero: string;
  type: string;
  objet: string;
  motif?: string;
  montantHt: number | string;
  prolongationJours: number;
  dateSignature?: string;
  status: string;
  impactPropageLe?: string;
}

export interface ApiAvenantImpactSimulation {
  avenantId: string;
  contratMarcheId: string;
  montantHtActuel: number | string;
  deltaMontantHt: number | string;
  montantHtApres: number | string;
  dureeMoisActuelle: number;
  deltaDureeMois: number;
  dureeMoisApres: number;
  prolongationJours: number;
  dejaPropage: boolean;
}

const TYPE_TO_UI: Record<string, AvenantType> = {
  TVX_SUPPLEMENTAIRES: 'TVX_SUPPLEMENTAIRES',
  PROLONGATION_DELAI: 'PROLONGATION_DELAI',
  ADAPTATION_TECHNIQUE: 'ADAPTATION_TECHNIQUE',
  MIXTE: 'MIXTE',
  MONTANT: 'TVX_SUPPLEMENTAIRES',
  DELAI: 'PROLONGATION_DELAI',
};

const STATUS_TO_UI: Record<string, AvenantStatus> = {
  BROUILLON: 'BROUILLON',
  EN_SIGNATURE: 'PROPOSE',
  PROPOSE: 'PROPOSE',
  SIGNE: 'SIGNE',
  APPLIQUE: 'SIGNE',
  ANNULE: 'REJETE',
};

const STATUS_TO_API: Partial<Record<AvenantStatus, string>> = {
  BROUILLON: 'BROUILLON',
  PROPOSE: 'PROPOSE',
  SIGNE: 'SIGNE',
  REJETE: 'ANNULE',
};

function num(v: number | string | undefined | null, fallback = 0): number {
  if (v == null) return fallback;
  return typeof v === 'number' ? v : Number(v);
}

export function mapUiAvenantStatusToBackend(status: AvenantStatus): string {
  return STATUS_TO_API[status] ?? status;
}

export function avenantToUi(row: ApiAvenant): Avenant {
  return {
    id: row.id,
    numero: row.numero,
    marcheId: row.contratMarcheId,
    marcheNumero: row.marcheNumero,
    type: TYPE_TO_UI[row.type] ?? 'AUTRE',
    objet: row.objet,
    motif: row.motif ?? '',
    montantHt: num(row.montantHt),
    prolongationJours: row.prolongationJours ?? 0,
    dateSignature: row.dateSignature,
    status: STATUS_TO_UI[row.status] ?? 'BROUILLON',
    impactPropageLe: row.impactPropageLe,
  };
}

export function avenantCreateToApi(data: Partial<Avenant>): Record<string, unknown> {
  return {
    id: data.id,
    numero: data.numero,
    contratMarcheId: data.marcheId,
    type: data.type,
    objet: data.objet,
    motif: data.motif,
    montantHt: data.montantHt,
    prolongationJours: data.prolongationJours,
    dateSignature: data.dateSignature,
    status: data.status ? mapUiAvenantStatusToBackend(data.status) : undefined,
  };
}
