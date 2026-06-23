/**
 * ItemType Listing Routes — Auto-generated from item-type.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ItemTypeListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ItemTypeListItem> = {
  detail: (item) => ['/inventory/configuration/item-types', item.id],
  create: ['/inventory/configuration/item-types/new'],
  list: ['/inventory/configuration/item-types'],
};
