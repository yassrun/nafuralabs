/**
 * InventoryTx Listing Columns — Auto-generated from inventory-tx.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'txNumber',
    label: 'inventory.fields.txNumber',
    field: 'txNumber',
    sortable: true,
  },
  {
    key: 'txType',
    label: 'inventory.fields.txType',
    field: 'txType',
  },
  {
    key: 'warehouseId',
    label: 'inventory.fields.warehouse',
    field: 'warehouseId',
  },
  {
    key: 'txDate',
    label: 'inventory.fields.txDate',
    field: 'txDate',
    sortable: true,
  },
  {
    key: 'reference',
    label: 'inventory.fields.reference',
    field: 'reference',
  },
  {
    key: 'status',
    label: 'inventory.fields.status',
    field: 'status',
  },
];
