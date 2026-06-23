/**
 * UoMCategory Listing Routes — Auto-generated from uo-mcategory.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { UoMCategoryListItem } from '../../models';

export const ROUTES: ListingRouteConfig<UoMCategoryListItem> = {
  detail: (item) => ['/inventory/configuration/uo-mcategories', item.id],
  create: ['/inventory/configuration/uo-mcategories/new'],
  list: ['/inventory/configuration/uo-mcategories'],
};
