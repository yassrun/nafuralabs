/**
 * Item Listing Routes — Auto-generated from item.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ItemListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ItemListItem> = {
  detail: (item) => ['/stock/catalogue/items', item.id],
  create: ['/stock/catalogue/items/new'],
  list: ['/stock/catalogue/items'],
};
