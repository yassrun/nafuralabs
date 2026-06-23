/**
 * Tag Model — Auto-generated from tag.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface Tag {
  id: string;
  code: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TagListItem = Pick<Tag,
  'id' | 'code' | 'name' | 'createdAt' | 'updatedAt'
>;

export type TagCreate = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;

export type TagUpdate = Partial<TagCreate>;

export interface TagQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
