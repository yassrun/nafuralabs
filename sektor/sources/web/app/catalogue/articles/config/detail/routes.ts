import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { Article } from '../../models';

export const ROUTES: DetailRouteConfig<Article> = {
  list: ['/inventory/catalogue/articles'],
  edit: (item) => ['/inventory/catalogue/articles', item.id],
  view: (item) => ['/inventory/catalogue/articles', item.id],
};
