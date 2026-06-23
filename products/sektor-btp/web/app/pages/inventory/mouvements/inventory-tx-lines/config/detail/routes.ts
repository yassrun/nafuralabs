/**
 * InventoryTxLine Detail Routes — Auto-generated from inventory-tx-line.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { InventoryTxLine } from '../../models';

export const ROUTES: DetailRouteConfig<InventoryTxLine> = {
  list: ['/erp/inventory-tx-lines'],
  edit: (item) => ['/erp/inventory-tx-lines', item.id],
  view: (item) => ['/erp/inventory-tx-lines', item.id],
};
