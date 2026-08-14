/**
 * UoM Category Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { UomCategoryListItem } from '../../models';

export const ROUTES: ListingRouteConfig<UomCategoryListItem> = {
  detail: (item) => ['/inventory/configuration/uom-categories', item.id],
  create: ['/inventory/configuration/uom-categories/new'],
  list: ['/inventory/configuration/uom-categories'],
};
