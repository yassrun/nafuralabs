import type { DGD, DgdStatus } from '../../models';

export interface ApiDgdMarche {
  id: string;
  numero: string;
  contratMarcheId: string;
  marcheNumero?: string;
  cumulSituationsTtc: number | string;
  cumulRetenueGarantie: number | string;
  cumulRevisionK: number | string;
  cumulPenalites: number | string;
  reprisesRg: number | string;
  montantNetAPayer: number | string;
  status: string;
}

function num(v: number | string | undefined | null, fallback = 0): number {
  if (v == null) return fallback;
  return typeof v === 'number' ? v : Number(v);
}

export function dgdToUi(row: ApiDgdMarche): DGD {
  return {
    id: row.id,
    numero: row.numero,
    marcheId: row.contratMarcheId,
    marcheNumero: row.marcheNumero ?? row.contratMarcheId,
    cumulSituationsTtc: num(row.cumulSituationsTtc),
    cumulRetenueGarantie: num(row.cumulRetenueGarantie),
    cumulRevisionK: num(row.cumulRevisionK),
    cumulPenalites: num(row.cumulPenalites),
    reprisesRG: num(row.reprisesRg),
    montantNetAPayer: num(row.montantNetAPayer),
    status: row.status as DgdStatus,
  };
}
