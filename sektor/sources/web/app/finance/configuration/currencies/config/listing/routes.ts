/**
 * Currency Listing Routes — Auto-generated from currency.entity.json
 */

import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { CurrencyListItem } from '../../models';

export const ROUTES: ListingRouteConfig<CurrencyListItem> = {
  detail: (item) => ['/finance/configuration/currencies', item.id],
  create: ['/finance/configuration/currencies/new'],
  list: ['/finance/configuration/currencies'],
};
