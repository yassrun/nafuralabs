/**
 * ItemPrice Listing Columns — Auto-generated from item-price.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'itemId',
    label: 'directory.fields.itemId',
    field: 'itemId',
  },
  {
    key: 'priceType',
    label: 'directory.fields.priceType',
    field: 'priceType',
  },
  {
    key: 'currencyId',
    label: 'directory.fields.currencyId',
    field: 'currencyId',
  },
  {
    key: 'unitPrice',
    label: 'directory.fields.unitPrice',
    field: 'unitPrice',
    type: 'number',
    sortable: true,
  },
  {
    key: 'effectiveFrom',
    label: 'directory.fields.effectiveFrom',
    field: 'effectiveFrom',
    sortable: true,
  },
  {
    key: 'minQuantity',
    label: 'directory.fields.minQuantity',
    field: 'minQuantity',
    type: 'number',
  },
  {
    key: 'effectiveTo',
    label: 'directory.fields.effectiveTo',
    field: 'effectiveTo',
  },
];
