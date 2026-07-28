/**
 * Costing Method Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { CostingMethodListItem } from '../../models';

export const ROUTES: ListingRouteConfig<CostingMethodListItem> = {
  detail: (item) => ['/stock/configuration/costing-methods', item.id],
  create: ['/stock/configuration/costing-methods/new'],
  list: ['/stock/configuration/costing-methods'],
};
