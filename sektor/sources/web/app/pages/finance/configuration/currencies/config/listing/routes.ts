/**
 * Currency Listing Routes — Auto-generated from currency.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { CurrencyListItem } from '../../models';

export const ROUTES: ListingRouteConfig<CurrencyListItem> = {
  detail: (item) => ['/finance/configuration/currencies', item.id],
  create: ['/finance/configuration/currencies/new'],
  list: ['/finance/configuration/currencies'],
};
