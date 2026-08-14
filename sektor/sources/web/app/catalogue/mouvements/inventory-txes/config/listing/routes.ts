/**
 * InventoryTx Listing Routes — Auto-generated from inventory-tx.entity.json
 */

import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { InventoryTxListItem } from '../../models';

export const ROUTES: ListingRouteConfig<InventoryTxListItem> = {
  detail: (item) => ['/inventory/mouvements/inventory-txes', item.id],
  create: ['/inventory/mouvements/inventory-txes/new'],
  list: ['/inventory/mouvements/inventory-txes'],
};
