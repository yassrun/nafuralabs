/**
 * InventoryTx Listing Routes — Auto-generated from inventory-tx.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { InventoryTxListItem } from '../../models';

export const ROUTES: ListingRouteConfig<InventoryTxListItem> = {
  detail: (item) => ['/stock/mouvements/inventory-txes', item.id],
  create: ['/stock/mouvements/inventory-txes/new'],
  list: ['/stock/mouvements/inventory-txes'],
};
