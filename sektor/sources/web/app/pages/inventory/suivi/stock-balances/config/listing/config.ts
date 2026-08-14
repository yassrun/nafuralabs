/**
 * StockBalance Listing Configuration — Auto-generated from stock-balance.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { StockBalanceListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const STOCK_BALANCE_LISTING_CONFIG = buildListingConfig<StockBalanceListItem>(
  {
    entityName: 'StockBalance',
    entityNamePlural: 'Stock Balances',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'stock.stock-balance',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'itemId',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'package-2',
    },
  }
);
