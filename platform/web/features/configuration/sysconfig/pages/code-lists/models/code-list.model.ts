/**
 * CodeList Model — Auto-generated from code-list.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface CodeList {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CodeListListItem = Pick<CodeList,
  'id' | 'code' | 'name' | 'createdAt' | 'updatedAt'
>;

export type CodeListCreate = Omit<CodeList, 'id' | 'createdAt' | 'updatedAt'>;

export type CodeListUpdate = Partial<CodeListCreate>;

export interface CodeListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
