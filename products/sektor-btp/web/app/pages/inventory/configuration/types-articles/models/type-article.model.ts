/**
 * Type Article Configuration Models
 */

import type { ArticleType } from '../../../../../inventory/models';

export interface TypeArticleConfig {
  id: string;
  code: string;
  name: string;
  articleType: ArticleType;
  isActive: boolean;
}

export type TypeArticleListItem = TypeArticleConfig;

export type TypeArticleCreate = Omit<TypeArticleConfig, 'id'>;

export type TypeArticleUpdate = Partial<TypeArticleCreate>;
