/**
 * Currency Listing Configuration — Auto-generated from currency.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { CurrencyListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const CURRENCY_LISTING_CONFIG = buildListingConfig<CurrencyListItem>(
  {
    entityName: 'Currency',
    entityNamePlural: 'Currencies',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'currency.currency',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'code',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'circle-dollar-sign',
    },
  }
);
