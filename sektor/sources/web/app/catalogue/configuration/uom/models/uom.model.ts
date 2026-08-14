/**
 * Unit of Measure Configuration Models
 */

export interface UomConfig {
  id: string;
  code: string;
  name: string;
  uomCategoryId: string;
  facteurVersBase: number;
  estBase: boolean;
  isActive: boolean;
}

export interface UomListItem extends UomConfig {
  uomCategoryName?: string;
}

export type UomCreate = Omit<UomConfig, 'id'>;

export type UomUpdate = Partial<UomCreate>;
