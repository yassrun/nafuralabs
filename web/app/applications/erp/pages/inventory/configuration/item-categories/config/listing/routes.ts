/**
 * ItemCategory Listing Routes — Auto-generated from item-category.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ItemCategoryListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ItemCategoryListItem> = {
  detail: (item) => ['/inventory/configuration/item-categories', item.id],
  create: ['/inventory/configuration/item-categories/new'],
  list: ['/inventory/configuration/item-categories'],
};
