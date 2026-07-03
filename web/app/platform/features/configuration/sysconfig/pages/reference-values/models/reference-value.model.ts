/**
 * ReferenceValue Model — Auto-generated from reference-value.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface ReferenceValue {
  id: string;
  codeListId: string;
  code: string;
  name: string;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ReferenceValueListItem = Pick<ReferenceValue,
  'id' | 'codeListId' | 'code' | 'name' | 'sortOrder' | 'createdAt' | 'updatedAt'
>;

export type ReferenceValueCreate = Omit<ReferenceValue, 'id' | 'createdAt' | 'updatedAt'>;

export type ReferenceValueUpdate = Partial<ReferenceValueCreate>;

export interface ReferenceValueQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  codeListId?: string;
  code?: string;
  name?: string;
}
