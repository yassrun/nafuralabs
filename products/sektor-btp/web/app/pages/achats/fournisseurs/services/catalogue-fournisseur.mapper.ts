import type {
  CatalogueFournisseurLigne,
  CatalogueFournisseurLigneCreate,
  CatalogueFournisseurLigneUpdate,
} from '@app/achats/models';

export interface ApiCatalogueFournisseurLigne {
  id: string;
  tenantId?: string;
  fournisseurId: string;
  articleId: string;
  refFournisseur?: string;
  designation: string;
  prixUnitaireHt: number | string;
  uomId?: string;
  conditionnementQuantite?: number | string | null;
  conditionnementUomId?: string;
  prixNormalise?: number | string | null;
  uomNormaliseId?: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function catalogueToUi(row: ApiCatalogueFournisseurLigne): CatalogueFournisseurLigne {
  return {
    id: row.id,
    fournisseurId: row.fournisseurId,
    articleId: row.articleId,
    refFournisseur: row.refFournisseur,
    designation: row.designation,
    prixUnitaireHt: toNumber(row.prixUnitaireHt),
    uomId: row.uomId,
    conditionnementQuantite: toNumberOrNull(row.conditionnementQuantite),
    conditionnementUomId: row.conditionnementUomId,
    prixNormalise: toNumberOrNull(row.prixNormalise),
    uomNormaliseId: row.uomNormaliseId,
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
    uomId: data.uomId || undefined,
    conditionnementQuantite: data.conditionnementQuantite ?? undefined,
    conditionnementUomId: data.conditionnementUomId || undefined,
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
  if (data.uomId !== undefined) body['uomId'] = data.uomId || null;
  if (data.conditionnementQuantite !== undefined) {
    body['conditionnementQuantite'] = data.conditionnementQuantite;
  }
  if (data.conditionnementUomId !== undefined) {
    body['conditionnementUomId'] = data.conditionnementUomId || null;
  }
  if (data.actif !== undefined) body['actif'] = data.actif;
  return body;
}
