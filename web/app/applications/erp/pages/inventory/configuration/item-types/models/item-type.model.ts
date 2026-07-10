/**
 * ItemType Model — Auto-generated from item-type.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface ItemType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemTypeListItem = Pick<ItemType,
  'id' | 'code' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type ItemTypeCreate = Omit<ItemType, 'id' | 'createdAt' | 'updatedAt'>;

export type ItemTypeUpdate = Partial<ItemTypeCreate>;

export interface ItemTypeQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
