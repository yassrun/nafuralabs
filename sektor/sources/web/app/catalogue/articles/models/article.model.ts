import type { ArticleType, Nature } from '@app/catalogue/models';

export interface Article {
  id: string;
  code: string;
  name: string;
  /** Identité catalogue Sektor (`cle_stable`) — 1 Item par tenant. */
  cleStable?: string;
  description?: string;
  familleId: string;
  familleName?: string;
  /** Lots d'usage multi (VRD, GROS_OEUVRE, …) — axe disjoint de la famille. */
  lotsUsage?: string[];
  nature: Nature;
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
  | 'cleStable'
  | 'familleId'
  | 'familleName'
  | 'lotsUsage'
  | 'nature'
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
  'id' | 'createdAt' | 'updatedAt' | 'familleName' | 'uomCode' | 'stockTotal'
> & { devise?: string };

export type ArticleUpdate = Partial<ArticleCreate>;

export interface ArticleQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  familleId?: string;
  nature?: ArticleType;
  usageLot?: string;
  isActive?: boolean;
}
