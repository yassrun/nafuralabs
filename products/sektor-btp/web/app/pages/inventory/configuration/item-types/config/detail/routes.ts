/**
 * ItemType Detail Routes — Auto-generated from item-type.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { ItemType } from '../../models';

export const ROUTES: DetailRouteConfig<ItemType> = {
  list: ['/inventory/configuration/item-types'],
  edit: (item) => ['/inventory/configuration/item-types', item.id],
  view: (item) => ['/inventory/configuration/item-types', item.id],
};
