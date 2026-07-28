/**
 * ItemCategory Listing Routes — Auto-generated from item-category.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ItemCategoryListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ItemCategoryListItem> = {
  detail: (item) => ['/stock/configuration/item-categories', item.id],
  create: ['/stock/configuration/item-categories/new'],
  list: ['/stock/configuration/item-categories'],
};
