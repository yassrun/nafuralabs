/**
 * StockBalance Detail Routes — Auto-generated from stock-balance.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { StockBalance } from '../../models';

export const ROUTES: DetailRouteConfig<StockBalance> = {
  list: ['/stock/suivi/stock-balances'],
  edit: (item) => ['/stock/suivi/stock-balances', item.id],
  view: (item) => ['/stock/suivi/stock-balances', item.id],
};
