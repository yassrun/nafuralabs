/**
 * StockBalance Listing Columns — Auto-generated from stock-balance.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'warehouseId',
    label: 'inventory.fields.warehouse',
    field: 'warehouseId',
  },
  {
    key: 'itemId',
    label: 'inventory.fields.item',
    field: 'itemId',
  },
  {
    key: 'quantity',
    label: 'inventory.fields.quantity',
    field: 'quantity',
    type: 'number',
    sortable: true,
  },
  {
    key: 'reservedQuantity',
    label: 'inventory.fields.reservedQuantity',
    field: 'reservedQuantity',
    type: 'number',
    sortable: true,
  },
  {
    key: 'availableQuantity',
    label: 'inventory.fields.availableQuantity',
    field: 'availableQuantity',
    type: 'number',
    sortable: true,
  },
];
