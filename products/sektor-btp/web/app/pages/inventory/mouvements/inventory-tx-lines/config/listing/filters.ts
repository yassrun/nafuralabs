/**
 * InventoryTxLine Listing Filters — Auto-generated from inventory-tx-line.entity.json
 */

import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'itemId',
    label: 'inventory.fields.item',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'items',
  },
  {
    key: 'quantity',
    label: 'inventory.fields.quantity',
    type: 'text',
  },
  {
    key: 'unitPrice',
    label: 'inventory.fields.unitPrice',
    type: 'text',
  },
];
