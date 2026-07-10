import type {
  DALigne,
  DemandeAchat,
  DemandeAchatCreate,
  DemandeAchatListItem,
  DemandeAchatUpdate,
} from '@applications/erp/achats/models';

export interface ApiDemandeAchatLigne {
  id: string;
  daId?: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  quantite: number;
  uomCode?: string;
  prixEstimeHt?: number;
  totalEstimeHt?: number;
  notes?: string;
}

export interface ApiDemandeAchat {
  id: string;
  numero: string;
  chantierId?: string;
  chantierCode?: string;
  chantierName?: string;
  dateBesoin: string;
  demandeurId: string;
  demandeurName?: string;
  motif?: string;
  status: string;
  approbateurId?: string;
  approbateurName?: string;
  approbationDate?: string;
  motifRejet?: string;
  bcId?: string;
  bcNumero?: string;
  totalEstimeHt: number;
  notes?: string;
  lignes?: ApiDemandeAchatLigne[];
  createdAt: string;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function lineToUi(row: ApiDemandeAchatLigne, daId: string): DALigne {
  return {
    id: row.id,
    daId: row.daId ?? daId,
    articleId: row.articleId,
    articleCode: row.articleCode,
    articleName: row.articleName,
    quantite: toNumber(row.quantite) ?? 0,
    uomCode: row.uomCode,
    prixEstimeHt: toNumber(row.prixEstimeHt),
    totalEstimeHt: toNumber(row.totalEstimeHt),
    notes: row.notes,
  };
}

export function demandeToUi(row: ApiDemandeAchat): DemandeAchat {
  const id = row.id;
  const lignes = (row.lignes ?? []).map((l) => lineToUi(l, id));
  return {
    id,
    numero: row.numero,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    chantierName: row.chantierName,
    dateBesoin: row.dateBesoin?.slice(0, 10) ?? row.dateBesoin,
    demandeurId: row.demandeurId,
    demandeurName: row.demandeurName,
    motif: row.motif,
    status: row.status as DemandeAchat['status'],
    approbateurId: row.approbateurId,
    approbateurName: row.approbateurName,
    approbationDate: row.approbationDate?.slice(0, 10),
    motifRejet: row.motifRejet,
    bcId: row.bcId,
    bcNumero: row.bcNumero,
    totalEstimeHt: toNumber(row.totalEstimeHt) ?? 0,
    notes: row.notes,
    lignes,
    createdAt: row.createdAt?.slice(0, 10) ?? row.createdAt,
  };
}

export function demandeToListItem(row: ApiDemandeAchat): DemandeAchatListItem {
  const ui = demandeToUi(row);
  const { lignes, ...header } = ui;
  return {
    ...header,
    nbLignes: lignes.length,
    delaiAttente:
      ui.status === 'SOUMISE' && ui.createdAt
        ? Math.max(
            0,
            Math.round(
              (Date.now() - new Date(ui.createdAt).getTime()) / 86400000,
            ),
          )
        : undefined,
  };
}

function lineToApi(line: DALigne): ApiDemandeAchatLigne {
  return {
    id: line.id,
    daId: line.daId,
    articleId: line.articleId,
    articleCode: line.articleCode,
    articleName: line.articleName,
    quantite: line.quantite,
    uomCode: line.uomCode,
    prixEstimeHt: line.prixEstimeHt,
    totalEstimeHt: line.totalEstimeHt,
    notes: line.notes,
  };
}

export function demandeCreateToApi(data: DemandeAchatCreate): Omit<ApiDemandeAchat, 'id' | 'numero' | 'createdAt'> {
  return {
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    chantierName: data.chantierName,
    dateBesoin: data.dateBesoin,
    demandeurId: data.demandeurId,
    demandeurName: data.demandeurName,
    motif: data.motif,
    status: data.status,
    approbateurId: data.approbateurId,
    approbateurName: data.approbateurName,
    approbationDate: data.approbationDate,
    motifRejet: data.motifRejet,
    bcId: data.bcId,
    bcNumero: data.bcNumero,
    totalEstimeHt: data.totalEstimeHt,
    notes: data.notes,
    lignes: (data.lignes ?? []).map(lineToApi),
  };
}

export function demandeUpdateToApi(data: DemandeAchatUpdate): Partial<ApiDemandeAchat> {
  const body: Partial<ApiDemandeAchat> = {};
  if (data.chantierId !== undefined) body.chantierId = data.chantierId;
  if (data.chantierCode !== undefined) body.chantierCode = data.chantierCode;
  if (data.chantierName !== undefined) body.chantierName = data.chantierName;
  if (data.dateBesoin !== undefined) body.dateBesoin = data.dateBesoin;
  if (data.demandeurId !== undefined) body.demandeurId = data.demandeurId;
  if (data.demandeurName !== undefined) body.demandeurName = data.demandeurName;
  if (data.motif !== undefined) body.motif = data.motif;
  if (data.status !== undefined) body.status = data.status;
  if (data.approbateurId !== undefined) body.approbateurId = data.approbateurId;
  if (data.approbateurName !== undefined) body.approbateurName = data.approbateurName;
  if (data.approbationDate !== undefined) body.approbationDate = data.approbationDate;
  if (data.motifRejet !== undefined) body.motifRejet = data.motifRejet;
  if (data.bcId !== undefined) body.bcId = data.bcId;
  if (data.bcNumero !== undefined) body.bcNumero = data.bcNumero;
  if (data.notes !== undefined) body.notes = data.notes;
  if (data.lignes !== undefined) body.lignes = data.lignes.map(lineToApi);
  return body;
}
