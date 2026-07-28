/**
 * StockBalance Listing Routes — Auto-generated from stock-balance.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { StockBalanceListItem } from '../../models';

export const ROUTES: ListingRouteConfig<StockBalanceListItem> = {
  detail: (item) => ['/stock/suivi/stock-balances', item.id],
  create: ['/stock/suivi/stock-balances/new'],
  list: ['/stock/suivi/stock-balances'],
};
