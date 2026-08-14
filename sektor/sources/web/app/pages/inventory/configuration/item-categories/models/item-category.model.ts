/**
 * ItemCategory Model — Auto-generated from item-category.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface ItemCategory {
  id: string;
  parentId?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemCategoryListItem = Pick<ItemCategory,
  'id' | 'code' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type ItemCategoryCreate = Omit<ItemCategory, 'id' | 'createdAt' | 'updatedAt'>;

export type ItemCategoryUpdate = Partial<ItemCategoryCreate>;

export interface ItemCategoryQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
