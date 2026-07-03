/**
 * Type Article Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { TypeArticleListItem } from '../../models';

export const ROUTES: ListingRouteConfig<TypeArticleListItem> = {
  detail: (item) => ['/inventory/configuration/types-articles', item.id],
  create: ['/inventory/configuration/types-articles/new'],
  list: ['/inventory/configuration/types-articles'],
};
