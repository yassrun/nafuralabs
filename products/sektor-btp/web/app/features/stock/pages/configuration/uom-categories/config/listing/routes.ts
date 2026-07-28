/**
 * UoM Category Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { UomCategoryListItem } from '../../models';

export const ROUTES: ListingRouteConfig<UomCategoryListItem> = {
  detail: (item) => ['/stock/configuration/uom-categories', item.id],
  create: ['/stock/configuration/uom-categories/new'],
  list: ['/stock/configuration/uom-categories'],
};
