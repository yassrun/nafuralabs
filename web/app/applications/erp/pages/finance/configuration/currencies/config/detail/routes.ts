/**
 * Currency Detail Routes — Auto-generated from currency.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Currency } from '../../models';

export const ROUTES: DetailRouteConfig<Currency> = {
  list: ['/finance/configuration/currencies'],
  edit: (item) => ['/finance/configuration/currencies', item.id],
  view: (item) => ['/finance/configuration/currencies', item.id],
};
