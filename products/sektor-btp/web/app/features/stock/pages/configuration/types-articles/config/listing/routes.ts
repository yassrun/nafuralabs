/**
 * Type Article Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { TypeArticleListItem } from '../../models';

export const ROUTES: ListingRouteConfig<TypeArticleListItem> = {
  detail: (item) => ['/stock/configuration/types-articles', item.id],
  create: ['/stock/configuration/types-articles/new'],
  list: ['/stock/configuration/types-articles'],
};
