import type {
  BonCommandeClient,
  BonCommandeClientListItem,
  BCClientCreate,
  BCClientLigne,
  BCClientUpdate,
} from '@applications/erp/ventes/models';

export interface ApiBccLigne {
  id: string;
  bccId?: string;
  ordre: number;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
}

export interface ApiBcc {
  id: string;
  numero: string;
  numeroClient: string;
  clientId: string;
  clientName?: string;
  chantierId?: string;
  chantierCode?: string;
  dateReception: string;
  dateFinPrevue?: string;
  montantHt: number;
  tvaTaux: number;
  montantTtc: number;
  montantFactureHt: number;
  status: string;
  notes?: string;
  lignes?: ApiBccLigne[];
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function lineToUi(row: ApiBccLigne, bccId: string): BCClientLigne {
  return {
    id: row.id,
    bccId: row.bccId ?? bccId,
    ordre: row.ordre,
    designation: row.designation,
    unite: row.unite,
    quantite: toNumber(row.quantite),
    prixUnitaireHt: toNumber(row.prixUnitaireHt),
    totalHt: toNumber(row.totalHt) ?? 0,
  };
}

export function bccToUi(row: ApiBcc): BonCommandeClient {
  const id = row.id;
  const lignes = (row.lignes ?? []).map((l) => lineToUi(l, id));
  return {
    id,
    numero: row.numero,
    numeroClient: row.numeroClient,
    clientId: row.clientId,
    clientName: row.clientName,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    dateReception: row.dateReception?.slice(0, 10) ?? row.dateReception,
    dateFinPrevue: row.dateFinPrevue?.slice(0, 10) ?? row.dateFinPrevue,
    montantHt: toNumber(row.montantHt) ?? 0,
    tvaTaux: toNumber(row.tvaTaux) ?? 20,
    montantTtc: toNumber(row.montantTtc) ?? 0,
    montantFactureHt: toNumber(row.montantFactureHt) ?? 0,
    status: row.status as BonCommandeClient['status'],
    notes: row.notes,
    lignes,
  };
}

export function bccToListItem(row: ApiBcc): BonCommandeClientListItem {
  const ui = bccToUi(row);
  const { lignes, ...header } = ui;
  const montantHt = ui.montantHt;
  const montantFactureHt = ui.montantFactureHt;
  return {
    ...header,
    nbLignes: lignes.length,
    tauxFacturation: montantHt > 0 ? Math.round((montantFactureHt / montantHt) * 100) : 0,
    resteAFacturerHt: Math.max(0, montantHt - montantFactureHt),
  };
}

export function bccCreateToApi(data: BCClientCreate): Record<string, unknown> {
  return {
    numeroClient: data.numeroClient,
    clientId: data.clientId,
    clientName: data.clientName,
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    dateReception: data.dateReception,
    dateFinPrevue: data.dateFinPrevue,
    tvaTaux: data.tvaTaux,
    status: data.status,
    notes: data.notes,
    lignes: (data.lignes ?? []).map((l) => ({
      ordre: l.ordre,
      designation: l.designation,
      unite: l.unite,
      quantite: l.quantite,
      prixUnitaireHt: l.prixUnitaireHt,
      totalHt: l.totalHt,
    })),
  };
}

export function bccUpdateToApi(data: BCClientUpdate): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.numeroClient !== undefined) body['numeroClient'] = data.numeroClient;
  if (data.clientId !== undefined) body['clientId'] = data.clientId;
  if (data.clientName !== undefined) body['clientName'] = data.clientName;
  if (data.chantierId !== undefined) body['chantierId'] = data.chantierId;
  if (data.chantierCode !== undefined) body['chantierCode'] = data.chantierCode;
  if (data.dateReception !== undefined) body['dateReception'] = data.dateReception;
  if (data.dateFinPrevue !== undefined) body['dateFinPrevue'] = data.dateFinPrevue;
  if (data.tvaTaux !== undefined) body['tvaTaux'] = data.tvaTaux;
  if (data.status !== undefined) body['status'] = data.status;
  if (data.notes !== undefined) body['notes'] = data.notes;
  if (data.lignes !== undefined) {
    body['lignes'] = data.lignes.map((l) => ({
      ordre: l.ordre,
      designation: l.designation,
      unite: l.unite,
      quantite: l.quantite,
      prixUnitaireHt: l.prixUnitaireHt,
      totalHt: l.totalHt,
    }));
  }
  return body;
}
