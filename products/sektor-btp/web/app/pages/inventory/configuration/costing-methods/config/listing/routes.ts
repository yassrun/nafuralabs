/**
 * Costing Method Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { CostingMethodListItem } from '../../models';

export const ROUTES: ListingRouteConfig<CostingMethodListItem> = {
  detail: (item) => ['/inventory/configuration/costing-methods', item.id],
  create: ['/inventory/configuration/costing-methods/new'],
  list: ['/inventory/configuration/costing-methods'],
};
