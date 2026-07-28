/**
 * Item Model — Auto-generated from item.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface Item {
  id: string;
  code?: string;
  name: string;
  description?: string;
  itemTypeId?: string;
  itemCategoryId?: string;
  unitOfMeasureId?: string;
  sku?: string;
  isActive?: boolean;
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
  createdAt: string;
  updatedAt: string;
}

export type ItemListItem = Pick<Item,
  'id' | 'code' | 'name' | 'itemTypeId' | 'sku' | 'isActive' | 'createdAt' | 'updatedAt'
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
  itemTypeId?: string;
  itemCategoryId?: string;
  sku?: string;
}
