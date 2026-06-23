/**
 * Item Listing Routes — Auto-generated from item.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ItemListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ItemListItem> = {
  detail: (item) => ['/inventory/catalogue/items', item.id],
  create: ['/inventory/catalogue/items/new'],
  list: ['/inventory/catalogue/items'],
};
