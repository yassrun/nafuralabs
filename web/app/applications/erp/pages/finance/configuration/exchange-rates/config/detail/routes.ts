/**
 * ExchangeRate Detail Routes — Auto-generated from exchange-rate.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { ExchangeRate } from '../../models';

export const ROUTES: DetailRouteConfig<ExchangeRate> = {
  list: ['/finance/configuration/exchange-rates'],
  edit: (item) => ['/finance/configuration/exchange-rates', item.id],
  view: (item) => ['/finance/configuration/exchange-rates', item.id],
};
