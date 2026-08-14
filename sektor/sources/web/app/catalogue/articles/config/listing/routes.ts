import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { ArticleListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ArticleListItem> = {
  detail: (item) => ['/inventory/catalogue/articles', item.id],
  create: ['/inventory/catalogue/articles/new'],
  list: ['/inventory/catalogue/articles'],
};
