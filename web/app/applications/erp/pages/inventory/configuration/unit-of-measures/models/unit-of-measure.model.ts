/**
 * UnitOfMeasure Model — Auto-generated from unit-of-measure.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  uomCategoryId?: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UnitOfMeasureListItem = Pick<UnitOfMeasure,
  'id' | 'code' | 'name' | 'uomCategoryId' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type UnitOfMeasureCreate = Omit<UnitOfMeasure, 'id' | 'createdAt' | 'updatedAt'>;

export type UnitOfMeasureUpdate = Partial<UnitOfMeasureCreate>;

export interface UnitOfMeasureQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
  uomCategoryId?: string;
}
