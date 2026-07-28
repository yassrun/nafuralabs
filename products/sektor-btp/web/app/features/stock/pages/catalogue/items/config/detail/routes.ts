/**
 * Item Detail Routes — Auto-generated from item.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Item } from '../../models';

export const ROUTES: DetailRouteConfig<Item> = {
  list: ['/stock/catalogue/items'],
  edit: (item) => ['/stock/catalogue/items', item.id],
  view: (item) => ['/stock/catalogue/items', item.id],
};
