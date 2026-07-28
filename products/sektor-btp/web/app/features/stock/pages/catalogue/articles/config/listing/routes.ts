import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ArticleListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ArticleListItem> = {
  detail: (item) => ['/stock/catalogue/articles', item.id],
  create: ['/stock/catalogue/articles/new'],
  list: ['/stock/catalogue/articles'],
};
