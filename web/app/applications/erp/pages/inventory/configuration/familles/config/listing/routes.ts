/**
 * Famille Article Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { FamilleArticleListItem } from '../../models';

export const ROUTES: ListingRouteConfig<FamilleArticleListItem> = {
  detail: (item) => ['/inventory/configuration/familles', item.id],
  create: ['/inventory/configuration/familles/new'],
  list: ['/inventory/configuration/familles'],
};
