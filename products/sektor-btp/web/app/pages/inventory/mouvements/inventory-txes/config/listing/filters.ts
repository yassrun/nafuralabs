/**
 * InventoryTx Listing Filters — Auto-generated from inventory-tx.entity.json
 */

import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'txNumber',
    label: 'inventory.fields.txNumber',
    type: 'text',
  },
  {
    key: 'txType',
    label: 'inventory.fields.txType',
    type: 'text',
  },
  {
    key: 'warehouseId',
    label: 'inventory.fields.warehouse',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'locations',
  },
  {
    key: 'txDate',
    label: 'inventory.fields.txDate',
    type: 'text',
  },
  {
    key: 'reference',
    label: 'inventory.fields.reference',
    type: 'text',
  },
  {
    key: 'status',
    label: 'inventory.fields.status',
    type: 'text',
  },
];
