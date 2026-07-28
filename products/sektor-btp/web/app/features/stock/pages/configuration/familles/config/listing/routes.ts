/**
 * Famille Article Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { FamilleArticleListItem } from '../../models';

export const ROUTES: ListingRouteConfig<FamilleArticleListItem> = {
  detail: (item) => ['/stock/configuration/familles', item.id],
  create: ['/stock/configuration/familles/new'],
  list: ['/stock/configuration/familles'],
};
