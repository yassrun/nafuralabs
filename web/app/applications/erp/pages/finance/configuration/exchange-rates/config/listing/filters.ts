/**
 * ExchangeRate Listing Filters — Auto-generated from exchange-rate.entity.json
 */

import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'fromCurrencyId',
    label: 'finance.fields.fromCurrency',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'currencies',
  },
  {
    key: 'toCurrencyId',
    label: 'finance.fields.toCurrency',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'currencies',
  },
  {
    key: 'effectiveDate',
    label: 'finance.fields.effectiveDate',
    type: 'text',
  },
  {
    key: 'source',
    label: 'finance.fields.source',
    type: 'text',
  },
];
