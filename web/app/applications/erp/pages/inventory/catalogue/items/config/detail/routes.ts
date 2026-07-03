/**
 * Item Detail Routes — Auto-generated from item.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Item } from '../../models';

export const ROUTES: DetailRouteConfig<Item> = {
  list: ['/inventory/catalogue/items'],
  edit: (item) => ['/inventory/catalogue/items', item.id],
  view: (item) => ['/inventory/catalogue/items', item.id],
};
