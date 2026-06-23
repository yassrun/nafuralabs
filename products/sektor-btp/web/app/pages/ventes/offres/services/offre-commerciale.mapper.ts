import type {
  OffreCommerciale,
  OffreCommercialeListItem,
  OffreCreate,
  OffreLigne,
  OffreUpdate,
} from '@applications/erp/ventes/models';

import type { ApiBcc } from '../../bons-commandes-clients/services/bcc.mapper';

export interface ApiOffreLigne {
  id: string;
  offreId?: string;
  ordre: number;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
}

export interface ApiOffre {
  id: string;
  numero: string;
  clientId: string;
  clientName?: string;
  chantierId?: string;
  chantierCode?: string;
  dateEmission: string;
  dateValidite: string;
  objet: string;
  totalHt: number;
  tvaTaux: number;
  totalTva: number;
  totalTtc: number;
  status: string;
  motifRefus?: string;
  notes?: string;
  bccId?: string;
  bccNumero?: string;
  lignes?: ApiOffreLigne[];
}

export interface ApiOffreConvertResult {
  offre: ApiOffre;
  bcc: ApiBcc;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function daysUntilValidity(dateValidite: string): number {
  const d = new Date(dateValidite);
  return Math.round((d.getTime() - Date.now()) / 86400000);
}

function lineToUi(row: ApiOffreLigne, offreId: string): OffreLigne {
  return {
    id: row.id,
    offreId: row.offreId ?? offreId,
    ordre: row.ordre,
    designation: row.designation,
    unite: row.unite,
    quantite: toNumber(row.quantite),
    prixUnitaireHt: toNumber(row.prixUnitaireHt),
    totalHt: toNumber(row.totalHt) ?? 0,
  };
}

export function offreToUi(row: ApiOffre): OffreCommerciale {
  const id = row.id;
  const lignes = (row.lignes ?? []).map((l) => lineToUi(l, id));
  return {
    id,
    numero: row.numero,
    clientId: row.clientId,
    clientName: row.clientName,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    dateEmission: row.dateEmission?.slice(0, 10) ?? row.dateEmission,
    dateValidite: row.dateValidite?.slice(0, 10) ?? row.dateValidite,
    objet: row.objet,
    totalHt: toNumber(row.totalHt) ?? 0,
    tvaTaux: toNumber(row.tvaTaux) ?? 20,
    totalTva: toNumber(row.totalTva) ?? 0,
    totalTtc: toNumber(row.totalTtc) ?? 0,
    status: row.status as OffreCommerciale['status'],
    motifRefus: row.motifRefus,
    notes: row.notes,
    bccId: row.bccId,
    bccNumero: row.bccNumero,
    lignes,
  };
}

export function offreToListItem(row: ApiOffre): OffreCommercialeListItem {
  const ui = offreToUi(row);
  const { lignes, ...header } = ui;
  return {
    ...header,
    nbLignes: lignes.length,
    joursValidite: daysUntilValidity(ui.dateValidite),
  };
}

function lineToApi(line: OffreLigne): ApiOffreLigne {
  return {
    id: line.id,
    offreId: line.offreId,
    ordre: line.ordre,
    designation: line.designation,
    unite: line.unite,
    quantite: line.quantite,
    prixUnitaireHt: line.prixUnitaireHt,
    totalHt: line.totalHt,
  };
}

export function offreCreateToApi(data: OffreCreate): Record<string, unknown> {
  return {
    clientId: data.clientId,
    clientName: data.clientName,
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    dateEmission: data.dateEmission,
    dateValidite: data.dateValidite,
    objet: data.objet,
    tvaTaux: data.tvaTaux,
    status: data.status,
    motifRefus: data.motifRefus,
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

export function offreUpdateToApi(data: OffreUpdate): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.clientId !== undefined) body['clientId'] = data.clientId;
  if (data.clientName !== undefined) body['clientName'] = data.clientName;
  if (data.chantierId !== undefined) body['chantierId'] = data.chantierId;
  if (data.chantierCode !== undefined) body['chantierCode'] = data.chantierCode;
  if (data.dateEmission !== undefined) body['dateEmission'] = data.dateEmission;
  if (data.dateValidite !== undefined) body['dateValidite'] = data.dateValidite;
  if (data.objet !== undefined) body['objet'] = data.objet;
  if (data.tvaTaux !== undefined) body['tvaTaux'] = data.tvaTaux;
  if (data.status !== undefined) body['status'] = data.status;
  if (data.motifRefus !== undefined) body['motifRefus'] = data.motifRefus;
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
