/**
 * ExchangeRate Listing Columns — Auto-generated from exchange-rate.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'fromCurrencyId',
    label: 'finance.fields.fromCurrency',
    field: 'fromCurrencyId',
  },
  {
    key: 'toCurrencyId',
    label: 'finance.fields.toCurrency',
    field: 'toCurrencyId',
  },
  {
    key: 'rate',
    label: 'finance.fields.rate',
    field: 'rate',
    type: 'number',
    sortable: true,
  },
  {
    key: 'effectiveDate',
    label: 'finance.fields.effectiveDate',
    field: 'effectiveDate',
    sortable: true,
  },
  {
    key: 'source',
    label: 'finance.fields.source',
    field: 'source',
  },
];
