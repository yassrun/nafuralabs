/**
 * ItemPrice Listing Routes — Auto-generated from item-price.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ItemPriceListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ItemPriceListItem> = {
  detail: (item) => ['/erp/item-prices', item.id],
  create: ['/erp/item-prices/new'],
  list: ['/erp/item-prices'],
};
