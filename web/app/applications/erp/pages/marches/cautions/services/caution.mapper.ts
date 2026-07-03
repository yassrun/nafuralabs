import type { CautionBancaire, CautionStatus, CautionType } from '../../models';

export interface ApiCautionMarche {
  id: string;
  numero: string;
  contratMarcheId: string;
  marcheNumero?: string;
  type: string;
  banquePartnerId?: string;
  banqueNom?: string;
  montant: number | string;
  dateEmission?: string;
  dateExpiration?: string;
  status: string;
  scanUrl?: string;
}

const TYPE_TO_UI: Record<string, CautionType> = {
  PROVISOIRE: 'PROVISOIRE',
  DEFINITIVE: 'DEFINITIVE',
  RG: 'RETENUE_GARANTIE',
  AVANCE: 'RESTITUTION_AVANCE',
};

const TYPE_TO_API: Record<CautionType, string> = {
  PROVISOIRE: 'PROVISOIRE',
  DEFINITIVE: 'DEFINITIVE',
  RETENUE_GARANTIE: 'RG',
  RESTITUTION_AVANCE: 'AVANCE',
};

const STATUS_TO_UI: Record<string, CautionStatus> = {
  ACTIVE: 'ACTIVE',
  RENOUVELEE: 'ACTIVE',
  MAINLEVEE: 'LEVEE',
  EXPIRE: 'EXPIRE',
  EN_MAINLEVEE: 'EMISE',
};

function num(v: number | string | undefined | null, fallback = 0): number {
  if (v == null) return fallback;
  return typeof v === 'number' ? v : Number(v);
}

export function cautionToUi(row: ApiCautionMarche): CautionBancaire {
  return {
    id: row.id,
    numero: row.numero,
    marcheId: row.contratMarcheId,
    marcheNumero: row.marcheNumero ?? row.contratMarcheId,
    type: TYPE_TO_UI[row.type] ?? 'PROVISOIRE',
    banqueEmettrice: row.banqueNom ?? '',
    montant: num(row.montant),
    dateEmission: row.dateEmission ?? '',
    dateValiditeJusquA: row.dateExpiration ?? '',
    status: STATUS_TO_UI[row.status] ?? 'ACTIVE',
  };
}

export function cautionCreateToApi(data: Partial<CautionBancaire>): Record<string, unknown> {
  return {
    id: data.id,
    numero: data.numero,
    contratMarcheId: data.marcheId,
    type: data.type ? TYPE_TO_API[data.type] : undefined,
    banqueNom: data.banqueEmettrice,
    montant: data.montant,
    dateEmission: data.dateEmission,
    dateExpiration: data.dateValiditeJusquA,
  };
}
