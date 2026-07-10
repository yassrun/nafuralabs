import type { Article, ArticleType } from '../models';
import type {
  ArticleCreate,
  ArticleUpdate,
} from '../../pages/inventory/catalogue/articles/models';
import type { Item, ItemCreate, ItemUpdate } from '../../pages/inventory/catalogue/items/models';

/** Backend item row with optional BTP columns from migration 007. */
export type ItemApiRow = Item & {
  articleType?: string;
  posteBudgetId?: string;
  defaultLocationId?: string;
  isPerissable?: boolean;
  abcClass?: string;
  pmp?: number;
  prixUnitaire?: number;
  stockMin?: number;
  stockMax?: number;
  delaiReapproJours?: number;
};

export function itemToArticle(item: ItemApiRow): Article {
  return {
    id: item.id,
    code: item.code ?? '',
    name: item.name,
    description: item.description,
    familleId: item.itemCategoryId ?? '',
    typeArticleId: item.itemTypeId ?? '',
    uomId: item.unitOfMeasureId ?? '',
    articleType: (item.articleType as ArticleType) ?? 'MATERIAU',
    stockMin: item.stockMin,
    stockMax: item.stockMax,
    prixUnitaire: item.prixUnitaire,
    pmp: item.pmp,
    delaiReapproJours: item.delaiReapproJours,
    isPerissable: item.isPerissable,
    posteBudgetId: item.posteBudgetId,
    isActive: item.isActive !== false,
  };
}

export function articleCreateToItem(data: ArticleCreate): ItemCreate {
  return {
    code: data.code,
    name: data.name,
    description: data.description,
    itemTypeId: data.typeArticleId,
    itemCategoryId: data.familleId,
    unitOfMeasureId: data.uomId,
    isActive: data.isActive,
    articleType: data.articleType,
    posteBudgetId: data.posteBudgetId,
    isPerissable: data.isPerissable,
    pmp: data.pmp,
    prixUnitaire: data.prixUnitaire,
    stockMin: data.stockMin,
    stockMax: data.stockMax,
    delaiReapproJours: data.delaiReapproJours,
  } as ItemCreate;
}

export function articleUpdateToItem(data: ArticleUpdate): ItemUpdate {
  const patch: ItemUpdate = {};
  if (data.code !== undefined) patch.code = data.code;
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (data.typeArticleId !== undefined) patch.itemTypeId = data.typeArticleId;
  if (data.familleId !== undefined) patch.itemCategoryId = data.familleId;
  if (data.uomId !== undefined) patch.unitOfMeasureId = data.uomId;
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.articleType !== undefined) (patch as ItemCreate).articleType = data.articleType;
  if (data.posteBudgetId !== undefined) (patch as ItemCreate).posteBudgetId = data.posteBudgetId;
  if (data.isPerissable !== undefined) (patch as ItemCreate).isPerissable = data.isPerissable;
  if (data.pmp !== undefined) (patch as ItemCreate).pmp = data.pmp;
  if (data.prixUnitaire !== undefined) (patch as ItemCreate).prixUnitaire = data.prixUnitaire;
  if (data.stockMin !== undefined) (patch as ItemCreate).stockMin = data.stockMin;
  if (data.stockMax !== undefined) (patch as ItemCreate).stockMax = data.stockMax;
  if (data.delaiReapproJours !== undefined) {
    (patch as ItemCreate).delaiReapproJours = data.delaiReapproJours;
  }
  return patch;
}
