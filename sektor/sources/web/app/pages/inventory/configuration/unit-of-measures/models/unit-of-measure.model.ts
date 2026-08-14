/**
 * UnitOfMeasure Model
 */

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  uomCategoryId?: string;
  description?: string;
  facteurVersBase: number;
  estBase: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UnitOfMeasureListItem = Pick<
  UnitOfMeasure,
  | 'id'
  | 'code'
  | 'name'
  | 'uomCategoryId'
  | 'facteurVersBase'
  | 'estBase'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
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

export interface UomConversionRequest {
  fromUomId: string;
  toUomId: string;
  quantity: number;
}

export interface UomConversionResult {
  fromUomId: string;
  fromCode: string;
  toUomId: string;
  toCode: string;
  quantityFrom: number;
  quantityTo: number;
  uomCategoryId: string;
}
