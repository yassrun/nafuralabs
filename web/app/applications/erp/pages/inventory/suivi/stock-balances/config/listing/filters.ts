/**
 * StockBalance Listing Filters — Auto-generated from stock-balance.entity.json
 */

import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'warehouseId',
    label: 'inventory.fields.warehouse',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'locations',
  },
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
];
