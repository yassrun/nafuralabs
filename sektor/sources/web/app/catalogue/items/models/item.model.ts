/**
 * Item Model — HTTP shape for /api/v1/items.
 */

export interface Item {
  id: string;
  code?: string;
  name: string;
  /** Identité catalogue Sektor — unique par tenant. */
  cleStable?: string;
  description?: string;
  itemCategoryId?: string;
  unitOfMeasureId?: string;
  sku?: string;
  isActive?: boolean;
  nature?: string;
  posteBudgetId?: string;
  defaultLocationId?: string;
  isPerissable?: boolean;
  abcClass?: string;
  pmp?: number;
  prixUnitaire?: number;
  stockMin?: number;
  stockMax?: number;
  delaiReapproJours?: number;
  usageLotCodes?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ItemListItem = Pick<
  Item,
  'id' | 'code' | 'name' | 'sku' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type ItemCreate = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;

export type ItemUpdate = Partial<ItemCreate>;

export interface ItemQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
  itemCategoryId?: string;
  sku?: string;
}
