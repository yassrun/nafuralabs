import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ArticleListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ArticleListItem> = {
  detail: (item) => ['/inventory/catalogue/articles', item.id],
  create: ['/inventory/catalogue/articles/new'],
  list: ['/inventory/catalogue/articles'],
};
