/**
 * UoMCategory Listing Routes — Auto-generated from uo-mcategory.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { UoMCategoryListItem } from '../../models';

export const ROUTES: ListingRouteConfig<UoMCategoryListItem> = {
  detail: (item) => ['/stock/configuration/uo-mcategories', item.id],
  create: ['/stock/configuration/uo-mcategories/new'],
  list: ['/stock/configuration/uo-mcategories'],
};
