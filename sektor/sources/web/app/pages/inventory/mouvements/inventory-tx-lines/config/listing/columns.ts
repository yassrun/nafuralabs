/**
 * InventoryTxLine Listing Columns — Auto-generated from inventory-tx-line.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'lineNumber',
    label: 'inventory.fields.lineNumber',
    field: 'lineNumber',
    type: 'number',
    sortable: true,
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
    key: 'unitPrice',
    label: 'inventory.fields.unitPrice',
    field: 'unitPrice',
    type: 'number',
  },
  {
    key: 'totalPrice',
    label: 'inventory.fields.totalPrice',
    field: 'totalPrice',
    type: 'number',
    sortable: true,
  },
];
