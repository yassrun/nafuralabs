import type { PenaliteMarche } from '../../models';

export interface ApiPenaliteMarche {
  id: string;
  numero: string;
  contratMarcheId: string;
  marcheNumero?: string;
  type: string;
  motif?: string;
  montantHt: number | string;
  joursRetard?: number;
  dateConstat?: string;
  status: string;
}

function num(v: number | string | undefined | null, fallback = 0): number {
  if (v == null) return fallback;
  return typeof v === 'number' ? v : Number(v);
}

export function penaliteToUi(row: ApiPenaliteMarche): PenaliteMarche {
  return {
    id: row.id,
    numero: row.numero,
    marcheId: row.contratMarcheId,
    marcheNumero: row.marcheNumero ?? row.contratMarcheId,
    type: row.type as PenaliteMarche['type'],
    motif: row.motif ?? '',
    montantHt: num(row.montantHt),
    joursRetard: row.joursRetard ?? 0,
    dateConstat: row.dateConstat ?? '',
    status: row.status as PenaliteMarche['status'],
  };
}

export function penaliteCreateToApi(data: Partial<PenaliteMarche>): Record<string, unknown> {
  return {
    id: data.id,
    numero: data.numero,
    contratMarcheId: data.marcheId,
    type: data.type,
    motif: data.motif,
    montantHt: data.montantHt,
    joursRetard: data.joursRetard,
    dateConstat: data.dateConstat,
    status: data.status,
  };
}
