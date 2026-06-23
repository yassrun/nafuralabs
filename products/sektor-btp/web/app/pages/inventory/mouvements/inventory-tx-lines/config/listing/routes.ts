/**
 * InventoryTxLine Listing Routes — Auto-generated from inventory-tx-line.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { InventoryTxLineListItem } from '../../models';

export const ROUTES: ListingRouteConfig<InventoryTxLineListItem> = {
  detail: (item) => ['/erp/inventory-tx-lines', item.id],
  create: ['/erp/inventory-tx-lines/new'],
  list: ['/erp/inventory-tx-lines'],
};
