import type { ArticleType } from '@applications/erp/inventory/models';

export interface Article {
  id: string;
  code: string;
  name: string;
  description?: string;
  familleId: string;
  familleName?: string;
  typeArticleId: string;
  typeArticleName?: string;
  articleType: ArticleType;
  uomId: string;
  uomCode?: string;
  prixUnitaire?: number;
  prixAchatDernier?: number;
  pmp?: number;
  delaiReapproJours?: number;
  fournisseurPrefereIds?: string[];
  uomSecondaireId?: string;
  uomSecondaireCode?: string;
  conversionFactor?: number;
  isPerissable?: boolean;
  isSerialise?: boolean;
  /** Code rubrique budget (ex. MATERIAUX) — liaison consommation (Task 5.7 V2). */
  posteBudgetId?: string;
  devise: string;
  stockMin?: number;
  stockMax?: number;
  stockTotal?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ArticleListItem = Pick<
  Article,
  | 'id'
  | 'code'
  | 'name'
  | 'familleId'
  | 'familleName'
  | 'articleType'
  | 'uomCode'
  | 'prixUnitaire'
  | 'pmp'
  | 'delaiReapproJours'
  | 'posteBudgetId'
  | 'stockTotal'
  | 'isActive'
>;

export type ArticleCreate = Omit<
  Article,
  'id' | 'createdAt' | 'updatedAt' | 'familleName' | 'typeArticleName' | 'uomCode' | 'stockTotal'
> & { devise?: string };

export type ArticleUpdate = Partial<ArticleCreate>;

export interface ArticleQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  familleId?: string;
  articleType?: ArticleType;
  isActive?: boolean;
}
