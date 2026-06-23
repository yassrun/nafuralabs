/**
 * UoM Category Configuration Models
 */

export interface UomCategoryConfig {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export type UomCategoryListItem = UomCategoryConfig;

export type UomCategoryCreate = Omit<UomCategoryConfig, 'id'>;

export type UomCategoryUpdate = Partial<UomCategoryCreate>;
