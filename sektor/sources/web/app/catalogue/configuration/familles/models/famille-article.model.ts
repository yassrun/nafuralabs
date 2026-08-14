/**
 * Famille Article Configuration Models
 */

export interface FamilleArticleConfig {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

export type FamilleArticleListItem = FamilleArticleConfig;

export type FamilleArticleCreate = Omit<FamilleArticleConfig, 'id'>;

export type FamilleArticleUpdate = Partial<FamilleArticleCreate>;
