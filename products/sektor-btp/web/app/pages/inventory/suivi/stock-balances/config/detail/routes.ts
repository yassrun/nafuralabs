/**
 * StockBalance Detail Routes — Auto-generated from stock-balance.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { StockBalance } from '../../models';

export const ROUTES: DetailRouteConfig<StockBalance> = {
  list: ['/inventory/suivi/stock-balances'],
  edit: (item) => ['/inventory/suivi/stock-balances', item.id],
  view: (item) => ['/inventory/suivi/stock-balances', item.id],
};
