/**
 * ExchangeRate Listing Configuration — Auto-generated from exchange-rate.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { ExchangeRateListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const EXCHANGE_RATE_LISTING_CONFIG = buildListingConfig<ExchangeRateListItem>(
  {
    entityName: 'ExchangeRate',
    entityNamePlural: 'Exchange Rates',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'currency.exchange-rate',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'effectiveDate',
      direction: 'desc',
    },
    features: {},
    emptyState: {
      icon: 'arrow-left-right',
    },
  }
);
