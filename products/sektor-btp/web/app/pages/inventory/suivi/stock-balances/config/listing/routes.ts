/**
 * StockBalance Listing Routes — Auto-generated from stock-balance.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { StockBalanceListItem } from '../../models';

export const ROUTES: ListingRouteConfig<StockBalanceListItem> = {
  detail: (item) => ['/inventory/suivi/stock-balances', item.id],
  create: ['/inventory/suivi/stock-balances/new'],
  list: ['/inventory/suivi/stock-balances'],
};
