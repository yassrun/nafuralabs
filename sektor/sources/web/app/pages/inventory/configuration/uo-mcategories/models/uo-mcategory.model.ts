/**
 * UoMCategory Model — Auto-generated from uo-mcategory.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface UoMCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UoMCategoryListItem = Pick<UoMCategory,
  'id' | 'code' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type UoMCategoryCreate = Omit<UoMCategory, 'id' | 'createdAt' | 'updatedAt'>;

export type UoMCategoryUpdate = Partial<UoMCategoryCreate>;

export interface UoMCategoryQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
