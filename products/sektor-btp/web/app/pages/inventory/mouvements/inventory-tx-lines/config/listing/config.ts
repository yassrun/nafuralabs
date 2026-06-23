/**
 * InventoryTxLine Listing Configuration — Auto-generated from inventory-tx-line.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { InventoryTxLineListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const INVENTORY_TX_LINE_LISTING_CONFIG = buildListingConfig<InventoryTxLineListItem>(
  {
    entityName: 'InventoryTxLine',
    entityNamePlural: 'Inventory Tx Lines',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'stock.inventory-tx-line',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'lineNumber',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'file-text',
    },
  }
);
