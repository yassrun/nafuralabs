/**
 * ExchangeRate Listing Routes — Auto-generated from exchange-rate.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ExchangeRateListItem } from '../../models';

export const ROUTES: ListingRouteConfig<ExchangeRateListItem> = {
  detail: (item) => ['/finance/configuration/exchange-rates', item.id],
  create: ['/finance/configuration/exchange-rates/new'],
  list: ['/finance/configuration/exchange-rates'],
};
