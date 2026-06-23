/**
 * InventoryTx Listing Configuration — Auto-generated from inventory-tx.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { InventoryTxListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const INVENTORY_TX_LISTING_CONFIG = buildListingConfig<InventoryTxListItem>(
  {
    entityName: 'InventoryTx',
    entityNamePlural: 'Inventory Txes',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'stock.inventory-tx',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'txDate',
      direction: 'desc',
    },
    features: {},
    emptyState: {
      icon: 'arrow-right-left',
    },
  }
);
