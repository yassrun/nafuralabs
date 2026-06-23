/**
 * Currency Listing Columns — Auto-generated from currency.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'code',
    label: 'finance.fields.code',
    field: 'code',
    sortable: true,
  },
  {
    key: 'name',
    label: 'finance.fields.name',
    field: 'name',
    sortable: true,
  },
  {
    key: 'symbol',
    label: 'finance.fields.symbol',
    field: 'symbol',
  },
  {
    key: 'decimalPlaces',
    label: 'finance.fields.decimalPlaces',
    field: 'decimalPlaces',
    type: 'number',
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    field: 'isActive',
    type: 'boolean',
  },
];
