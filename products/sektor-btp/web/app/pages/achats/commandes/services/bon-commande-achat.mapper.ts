import type {
  BCLigne,
  BonCommande,
  BonCommandeCreate,
  BonCommandeListItem,
  BonCommandeUpdate,
} from '@applications/erp/achats/models';

export interface ApiBonCommandeAchatLigne {
  id: string;
  bcId?: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  quantite: number;
  quantiteLivree: number;
  quantiteFacturee: number;
  uomCode?: string;
  prixUnitaireHt: number;
  totalHt: number;
  notes?: string;
}

export interface ApiBonCommandeAchat {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseurName?: string;
  chantierId?: string;
  chantierCode?: string;
  chantierName?: string;
  daId?: string;
  daNumero?: string;
  aoId?: string;
  aoNumero?: string;
  contratId?: string;
  contratNumero?: string;
  rubrique?: string;
  dateCreation: string;
  dateLivraisonPrevue: string;
  conditionsPaiement: string;
  modeReglement?: string;
  totalHt: number;
  tvaTaux: number;
  totalTtc: number;
  status: string;
  validateurId?: string;
  validateurName?: string;
  validationDate?: string;
  totalLivreHt: number;
  totalFactureHt: number;
  notes?: string;
  lignes?: ApiBonCommandeAchatLigne[];
  createdAt: string;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function lineToUi(row: ApiBonCommandeAchatLigne, bcId: string): BCLigne {
  return {
    id: row.id,
    bcId: row.bcId ?? bcId,
    articleId: row.articleId,
    articleCode: row.articleCode,
    articleName: row.articleName,
    quantite: toNumber(row.quantite) ?? 0,
    quantiteLivree: toNumber(row.quantiteLivree) ?? 0,
    quantiteFacturee: toNumber(row.quantiteFacturee) ?? 0,
    uomCode: row.uomCode,
    prixUnitaireHt: toNumber(row.prixUnitaireHt) ?? 0,
    totalHt: toNumber(row.totalHt) ?? 0,
    notes: row.notes,
  };
}

export function bcToUi(row: ApiBonCommandeAchat): BonCommande {
  const id = row.id;
  const lignes = (row.lignes ?? []).map((l) => lineToUi(l, id));
  return {
    id,
    numero: row.numero,
    fournisseurId: row.fournisseurId,
    fournisseurName: row.fournisseurName,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    chantierName: row.chantierName,
    daId: row.daId,
    daNumero: row.daNumero,
    aoId: row.aoId,
    aoNumero: row.aoNumero,
    contratId: row.contratId,
    contratNumero: row.contratNumero,
    rubrique: row.rubrique as BonCommande['rubrique'],
    dateCreation: row.dateCreation?.slice(0, 10) ?? row.dateCreation,
    dateLivraisonPrevue: row.dateLivraisonPrevue?.slice(0, 10) ?? row.dateLivraisonPrevue,
    conditionsPaiement: row.conditionsPaiement,
    modeReglement: row.modeReglement as BonCommande['modeReglement'],
    totalHt: toNumber(row.totalHt) ?? 0,
    tvaTaux: toNumber(row.tvaTaux) ?? 20,
    totalTtc: toNumber(row.totalTtc) ?? 0,
    status: row.status as BonCommande['status'],
    validateurId: row.validateurId,
    validateurName: row.validateurName,
    validationDate: row.validationDate?.slice(0, 10),
    totalLivreHt: toNumber(row.totalLivreHt) ?? 0,
    totalFactureHt: toNumber(row.totalFactureHt) ?? 0,
    notes: row.notes,
    lignes,
  };
}

const TODAY = new Date('2026-05-08');

export function bcToListItem(row: ApiBonCommandeAchat): BonCommandeListItem {
  const ui = bcToUi(row);
  const { lignes, ...header } = ui;
  const totalLivrePercent =
    ui.totalHt > 0 ? Math.round((ui.totalLivreHt / ui.totalHt) * 100) : 0;
  const enRetardLivraison =
    ui.dateLivraisonPrevue < TODAY.toISOString().slice(0, 10) &&
    !['LIVRE', 'FACTURE', 'CLOTURE', 'ANNULE'].includes(ui.status);
  return {
    ...header,
    nbLignes: lignes.length,
    totalLivrePercent,
    enRetardLivraison,
  };
}

function lineToApi(line: BCLigne): ApiBonCommandeAchatLigne {
  return {
    id: line.id,
    bcId: line.bcId,
    articleId: line.articleId,
    articleCode: line.articleCode,
    articleName: line.articleName,
    quantite: line.quantite,
    quantiteLivree: line.quantiteLivree,
    quantiteFacturee: line.quantiteFacturee,
    uomCode: line.uomCode,
    prixUnitaireHt: line.prixUnitaireHt,
    totalHt: line.totalHt,
    notes: line.notes,
  };
}

export function bcCreateToApi(
  data: BonCommandeCreate,
): Omit<ApiBonCommandeAchat, 'id' | 'numero' | 'createdAt' | 'totalHt' | 'totalTtc'> {
  return {
    fournisseurId: data.fournisseurId,
    fournisseurName: data.fournisseurName,
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    chantierName: data.chantierName,
    daId: data.daId,
    daNumero: data.daNumero,
    aoId: data.aoId,
    aoNumero: data.aoNumero,
    contratId: data.contratId,
    contratNumero: data.contratNumero,
    rubrique: data.rubrique,
    dateCreation: data.dateCreation,
    dateLivraisonPrevue: data.dateLivraisonPrevue,
    conditionsPaiement: data.conditionsPaiement,
    modeReglement: data.modeReglement,
    tvaTaux: data.tvaTaux,
    status: data.status,
    validateurId: data.validateurId,
    validateurName: data.validateurName,
    validationDate: data.validationDate,
    totalLivreHt: data.totalLivreHt,
    totalFactureHt: data.totalFactureHt,
    notes: data.notes,
    lignes: (data.lignes ?? []).map(lineToApi),
  };
}

export function bcUpdateToApi(data: BonCommandeUpdate): Partial<ApiBonCommandeAchat> {
  const body: Partial<ApiBonCommandeAchat> = {};
  if (data.fournisseurId !== undefined) body.fournisseurId = data.fournisseurId;
  if (data.fournisseurName !== undefined) body.fournisseurName = data.fournisseurName;
  if (data.chantierId !== undefined) body.chantierId = data.chantierId;
  if (data.chantierCode !== undefined) body.chantierCode = data.chantierCode;
  if (data.chantierName !== undefined) body.chantierName = data.chantierName;
  if (data.daId !== undefined) body.daId = data.daId;
  if (data.daNumero !== undefined) body.daNumero = data.daNumero;
  if (data.aoId !== undefined) body.aoId = data.aoId;
  if (data.aoNumero !== undefined) body.aoNumero = data.aoNumero;
  if (data.contratId !== undefined) body.contratId = data.contratId;
  if (data.contratNumero !== undefined) body.contratNumero = data.contratNumero;
  if (data.rubrique !== undefined) body.rubrique = data.rubrique;
  if (data.dateCreation !== undefined) body.dateCreation = data.dateCreation;
  if (data.dateLivraisonPrevue !== undefined) body.dateLivraisonPrevue = data.dateLivraisonPrevue;
  if (data.conditionsPaiement !== undefined) body.conditionsPaiement = data.conditionsPaiement;
  if (data.modeReglement !== undefined) body.modeReglement = data.modeReglement;
  if (data.tvaTaux !== undefined) body.tvaTaux = data.tvaTaux;
  if (data.status !== undefined) body.status = data.status;
  if (data.validateurId !== undefined) body.validateurId = data.validateurId;
  if (data.validateurName !== undefined) body.validateurName = data.validateurName;
  if (data.validationDate !== undefined) body.validationDate = data.validationDate;
  if (data.notes !== undefined) body.notes = data.notes;
  if (data.lignes !== undefined) body.lignes = data.lignes.map(lineToApi);
  return body;
}
