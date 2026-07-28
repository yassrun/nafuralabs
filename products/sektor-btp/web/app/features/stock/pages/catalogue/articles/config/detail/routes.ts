import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Article } from '../../models';

export const ROUTES: DetailRouteConfig<Article> = {
  list: ['/stock/catalogue/articles'],
  edit: (item) => ['/stock/catalogue/articles', item.id],
  view: (item) => ['/stock/catalogue/articles', item.id],
};
