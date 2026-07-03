import type {
  AOLigne,
  AOReponse,
  AOReponseLigne,
  AppelOffre,
  AppelOffreCreate,
  AppelOffreListItem,
  AppelOffreUpdate,
} from '@applications/erp/achats/models';

export interface ApiAppelOffreLigne {
  id: string;
  aoId?: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  quantite: number;
  uomCode?: string;
}

export interface ApiOffreFournisseurLigne {
  id: string;
  reponseId?: string;
  aoLigneId: string;
  prixUnitaireHt: number;
  totalHt: number;
  delaiSpecifique?: number;
}

export interface ApiOffreFournisseur {
  id: string;
  aoId?: string;
  fournisseurId: string;
  fournisseurName?: string;
  dateReponse?: string;
  totalHt: number;
  delaiLivraisonJours: number;
  conditionsPaiement?: string;
  notes?: string;
  lignes?: ApiOffreFournisseurLigne[];
  retenue: boolean;
  score?: number;
}

export interface ApiAppelOffreAchat {
  id: string;
  numero: string;
  objet: string;
  chantierId?: string;
  chantierCode?: string;
  chantierName?: string;
  fournisseurInvitesIds: string[];
  datePublication?: string;
  dateLimiteDepot: string;
  status: string;
  fournisseurAttribueId?: string;
  fournisseurAttribueName?: string;
  bcGenereId?: string;
  bcGenereNumero?: string;
  totalAttribueHt?: number;
  notes?: string;
  lignes?: ApiAppelOffreLigne[];
  reponses?: ApiOffreFournisseur[];
  createdAt: string;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function lineToUi(row: ApiAppelOffreLigne, aoId: string): AOLigne {
  return {
    id: row.id,
    aoId: row.aoId ?? aoId,
    articleId: row.articleId,
    articleCode: row.articleCode,
    articleName: row.articleName,
    quantite: toNumber(row.quantite) ?? 0,
    uomCode: row.uomCode,
  };
}

function offreLineToUi(row: ApiOffreFournisseurLigne, reponseId: string): AOReponseLigne {
  return {
    id: row.id,
    reponseId: row.reponseId ?? reponseId,
    aoLigneId: row.aoLigneId,
    prixUnitaireHt: toNumber(row.prixUnitaireHt) ?? 0,
    totalHt: toNumber(row.totalHt) ?? 0,
    delaiSpecifique: row.delaiSpecifique,
  };
}

function reponseToUi(row: ApiOffreFournisseur, aoId: string): AOReponse {
  const id = row.id;
  const lignes = (row.lignes ?? []).map((l) => offreLineToUi(l, id));
  return {
    id,
    aoId: row.aoId ?? aoId,
    fournisseurId: row.fournisseurId,
    fournisseurName: row.fournisseurName,
    dateReponse: row.dateReponse?.slice(0, 10) ?? row.dateReponse ?? '',
    totalHt: toNumber(row.totalHt) ?? 0,
    delaiLivraisonJours: row.delaiLivraisonJours ?? 0,
    conditionsPaiement: row.conditionsPaiement,
    notes: row.notes,
    lignes,
    retenue: row.retenue,
    score: toNumber(row.score),
  };
}

export function aoToUi(row: ApiAppelOffreAchat): AppelOffre {
  const id = row.id;
  const lignes = (row.lignes ?? []).map((l) => lineToUi(l, id));
  const reponses = (row.reponses ?? []).map((r) => reponseToUi(r, id));
  return {
    id,
    numero: row.numero,
    objet: row.objet,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    chantierName: row.chantierName,
    fournisseurInvitesIds: row.fournisseurInvitesIds ?? [],
    datePublication: row.datePublication?.slice(0, 10),
    dateLimiteDepot: row.dateLimiteDepot?.slice(0, 10) ?? row.dateLimiteDepot,
    status: row.status as AppelOffre['status'],
    fournisseurAttribueId: row.fournisseurAttribueId,
    fournisseurAttribueName: row.fournisseurAttribueName,
    bcGenereId: row.bcGenereId,
    bcGenereNumero: row.bcGenereNumero,
    totalAttribueHt: toNumber(row.totalAttribueHt),
    notes: row.notes,
    lignes,
    reponses,
    createdAt: row.createdAt?.slice(0, 10) ?? row.createdAt,
  };
}

export function aoToListItem(row: ApiAppelOffreAchat): AppelOffreListItem {
  const ui = aoToUi(row);
  const { lignes, reponses, fournisseurInvitesIds, ...header } = ui;
  return {
    ...header,
    nbLignes: lignes.length,
    nbInvites: fournisseurInvitesIds.length,
    nbReponses: reponses.length,
  };
}

function lineToApi(line: AOLigne): ApiAppelOffreLigne {
  return {
    id: line.id,
    aoId: line.aoId,
    articleId: line.articleId,
    articleCode: line.articleCode,
    articleName: line.articleName,
    quantite: line.quantite,
    uomCode: line.uomCode,
  };
}

function offreLineToApi(line: AOReponseLigne): ApiOffreFournisseurLigne {
  return {
    id: line.id,
    reponseId: line.reponseId,
    aoLigneId: line.aoLigneId,
    prixUnitaireHt: line.prixUnitaireHt,
    totalHt: line.totalHt,
    delaiSpecifique: line.delaiSpecifique,
  };
}

function reponseToApi(resp: AOReponse): ApiOffreFournisseur {
  return {
    id: resp.id,
    aoId: resp.aoId,
    fournisseurId: resp.fournisseurId,
    fournisseurName: resp.fournisseurName,
    dateReponse: resp.dateReponse,
    totalHt: resp.totalHt,
    delaiLivraisonJours: resp.delaiLivraisonJours,
    conditionsPaiement: resp.conditionsPaiement,
    notes: resp.notes,
    lignes: resp.lignes.map(offreLineToApi),
    retenue: resp.retenue,
    score: resp.score,
  };
}

export function aoCreateToApi(
  data: AppelOffreCreate,
): Omit<ApiAppelOffreAchat, 'id' | 'numero' | 'createdAt'> {
  return {
    objet: data.objet,
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    chantierName: data.chantierName,
    fournisseurInvitesIds: data.fournisseurInvitesIds ?? [],
    datePublication: data.datePublication,
    dateLimiteDepot: data.dateLimiteDepot,
    status: data.status,
    fournisseurAttribueId: data.fournisseurAttribueId,
    fournisseurAttribueName: data.fournisseurAttribueName,
    bcGenereId: data.bcGenereId,
    bcGenereNumero: data.bcGenereNumero,
    totalAttribueHt: data.totalAttribueHt,
    notes: data.notes,
    lignes: (data.lignes ?? []).map(lineToApi),
    reponses: (data.reponses ?? []).map(reponseToApi),
  };
}

export function aoUpdateToApi(data: AppelOffreUpdate): Partial<ApiAppelOffreAchat> {
  const body: Partial<ApiAppelOffreAchat> = {};
  if (data.objet !== undefined) body.objet = data.objet;
  if (data.chantierId !== undefined) body.chantierId = data.chantierId;
  if (data.chantierCode !== undefined) body.chantierCode = data.chantierCode;
  if (data.chantierName !== undefined) body.chantierName = data.chantierName;
  if (data.fournisseurInvitesIds !== undefined) {
    body.fournisseurInvitesIds = data.fournisseurInvitesIds;
  }
  if (data.datePublication !== undefined) body.datePublication = data.datePublication;
  if (data.dateLimiteDepot !== undefined) body.dateLimiteDepot = data.dateLimiteDepot;
  if (data.status !== undefined) body.status = data.status;
  if (data.fournisseurAttribueId !== undefined) {
    body.fournisseurAttribueId = data.fournisseurAttribueId;
  }
  if (data.fournisseurAttribueName !== undefined) {
    body.fournisseurAttribueName = data.fournisseurAttribueName;
  }
  if (data.bcGenereId !== undefined) body.bcGenereId = data.bcGenereId;
  if (data.bcGenereNumero !== undefined) body.bcGenereNumero = data.bcGenereNumero;
  if (data.totalAttribueHt !== undefined) body.totalAttribueHt = data.totalAttribueHt;
  if (data.notes !== undefined) body.notes = data.notes;
  if (data.lignes !== undefined) body.lignes = data.lignes.map(lineToApi);
  if (data.reponses !== undefined) body.reponses = data.reponses.map(reponseToApi);
  return body;
}
