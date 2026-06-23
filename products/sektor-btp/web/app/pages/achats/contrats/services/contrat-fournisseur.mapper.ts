import type {
  ContratAchat,
  ContratAchatCreate,
  ContratAchatListItem,
  ContratAchatUpdate,
} from '@applications/erp/achats/models';

const UI_TYPE_DEFAULT = 'CADRE' as const;

export interface ApiContratFournisseur {
  id: string;
  numero: string;
  type: string;
  fournisseurId: string;
  chantierId?: string;
  dateDebut: string;
  dateFin: string;
  status: string;
  montantHt?: number;
  art187Declare?: boolean;
  art187ValideMoa?: boolean;
  retenueGarantieTaux?: number;
  paiementDirectMoa?: boolean;
  notes?: string;
  createdAt: string;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function dateOnly(value: string | undefined): string {
  return value?.slice(0, 10) ?? '';
}

export function contratToUi(row: ApiContratFournisseur): ContratAchat {
  return {
    id: row.id,
    numero: row.numero,
    fournisseurId: row.fournisseurId,
    type: UI_TYPE_DEFAULT,
    objet: row.notes ?? '',
    dateDebut: dateOnly(row.dateDebut),
    dateFin: dateOnly(row.dateFin),
    montantPlafondHt: toNumber(row.montantHt),
    cumulBcEmisHt: 0,
    conditionsPaiement: '',
    status: row.status as ContratAchat['status'],
    notes: row.notes,
    createdAt: dateOnly(row.createdAt) || row.createdAt,
  };
}

export function contratToListItem(row: ApiContratFournisseur): ContratAchatListItem {
  const base = contratToUi(row);
  const consommationPercent =
    base.montantPlafondHt && base.montantPlafondHt > 0
      ? Math.round((base.cumulBcEmisHt / base.montantPlafondHt) * 100)
      : undefined;
  const d = new Date(base.dateFin);
  const t = new Date();
  const joursRestants = Math.round((d.getTime() - t.getTime()) / 86400000);
  return { ...base, consommationPercent, joursRestants };
}

export function contratCreateToApi(data: ContratAchatCreate): Record<string, unknown> {
  return {
    type:
      data.type === 'PONCTUEL' ? 'SOUS_TRAITANCE' : 'FOURNISSEUR',
    fournisseurId: data.fournisseurId,
    dateDebut: data.dateDebut,
    dateFin: data.dateFin,
    status: data.status,
    montantHt: data.montantPlafondHt,
    notes: data.objet || data.notes,
  };
}

export function contratUpdateToApi(data: ContratAchatUpdate): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.fournisseurId !== undefined) body['fournisseurId'] = data.fournisseurId;
  if (data.dateDebut !== undefined) body['dateDebut'] = data.dateDebut;
  if (data.dateFin !== undefined) body['dateFin'] = data.dateFin;
  if (data.status !== undefined) body['status'] = data.status;
  if (data.montantPlafondHt !== undefined) body['montantHt'] = data.montantPlafondHt;
  if (data.objet !== undefined || data.notes !== undefined) {
    body['notes'] = data.objet ?? data.notes;
  }
  if (data.type !== undefined) {
    body['type'] = data.type === 'PONCTUEL' ? 'SOUS_TRAITANCE' : 'FOURNISSEUR';
  }
  return body;
}
