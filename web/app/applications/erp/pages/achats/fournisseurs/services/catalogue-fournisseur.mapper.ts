import type {
  CatalogueFournisseurLigne,
  CatalogueFournisseurLigneCreate,
  CatalogueFournisseurLigneUpdate,
} from '@applications/erp/achats/models';

export interface ApiCatalogueFournisseurLigne {
  id: string;
  tenantId?: string;
  fournisseurId: string;
  articleId: string;
  refFournisseur?: string;
  designation: string;
  prixUnitaireHt: number | string;
  uom?: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function catalogueToUi(row: ApiCatalogueFournisseurLigne): CatalogueFournisseurLigne {
  return {
    id: row.id,
    fournisseurId: row.fournisseurId,
    articleId: row.articleId,
    refFournisseur: row.refFournisseur,
    designation: row.designation,
    prixUnitaireHt: toNumber(row.prixUnitaireHt),
    uom: row.uom,
    actif: row.actif ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function catalogueCreateToApi(
  data: CatalogueFournisseurLigneCreate,
): Record<string, unknown> {
  return {
    fournisseurId: data.fournisseurId,
    articleId: data.articleId,
    refFournisseur: data.refFournisseur,
    designation: data.designation,
    prixUnitaireHt: data.prixUnitaireHt,
    uom: data.uom,
    actif: data.actif ?? true,
  };
}

export function catalogueUpdateToApi(
  data: CatalogueFournisseurLigneUpdate,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.fournisseurId !== undefined) body['fournisseurId'] = data.fournisseurId;
  if (data.articleId !== undefined) body['articleId'] = data.articleId;
  if (data.refFournisseur !== undefined) body['refFournisseur'] = data.refFournisseur;
  if (data.designation !== undefined) body['designation'] = data.designation;
  if (data.prixUnitaireHt !== undefined) body['prixUnitaireHt'] = data.prixUnitaireHt;
  if (data.uom !== undefined) body['uom'] = data.uom;
  if (data.actif !== undefined) body['actif'] = data.actif;
  return body;
}
