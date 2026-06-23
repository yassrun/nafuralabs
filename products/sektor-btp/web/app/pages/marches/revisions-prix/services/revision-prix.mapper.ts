import type { FormuleRevisionK } from '../../models';

export interface ApiIndiceBtp {
  id: string;
  code: string;
  periode: string;
  valeur: number | string;
}

export interface ApiRevisionPrix {
  id: string;
  contratMarcheId: string;
  periode: string;
  coefficientK?: number | string | null;
  montantRevision?: number | string | null;
  formuleJson?: string | null;
  status: string;
}

export interface IndiceBtpRow {
  code: string;
  libelle: string;
  mois: string;
  valeur: number;
}

function num(v: number | string | undefined | null, fallback = 0): number {
  if (v == null) return fallback;
  return typeof v === 'number' ? v : Number(v);
}

const INDICE_LABELS: Record<string, string> = {
  BTP01: 'Béton armé',
  BTP18: 'Acier',
  MO: 'Main d\'œuvre',
};

export function indiceBtpToUi(row: ApiIndiceBtp): IndiceBtpRow {
  return {
    code: row.code,
    libelle: INDICE_LABELS[row.code] ?? row.code,
    mois: row.periode,
    valeur: num(row.valeur),
  };
}

export function parseFormuleJson(json: string | null | undefined): FormuleRevisionK | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as {
      termeFixe: number;
      termesVariables: Array<{ coefficient: number; indiceCode: string; indiceBaseValeur: number }>;
    };
    return {
      termeFixe: raw.termeFixe,
      termesVariables: raw.termesVariables ?? [],
    };
  } catch {
    return null;
  }
}

export function revisionCoefficientK(row: ApiRevisionPrix): number | null {
  if (row.coefficientK == null) return null;
  const k = num(row.coefficientK, NaN);
  return Number.isFinite(k) ? k : null;
}
