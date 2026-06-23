/**
 * ItemPrice Detail Routes — Auto-generated from item-price.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { ItemPrice } from '../../models';

export const ROUTES: DetailRouteConfig<ItemPrice> = {
  list: ['/erp/item-prices'],
  edit: (item) => ['/erp/item-prices', item.id],
  view: (item) => ['/erp/item-prices', item.id],
};
