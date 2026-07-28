/**
 * ItemType Listing Routes — Auto-generated from item-type.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ItemTypeListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ItemTypeListItem> = {
  detail: (item) => ['/stock/configuration/item-types', item.id],
  create: ['/stock/configuration/item-types/new'],
  list: ['/stock/configuration/item-types'],
};
