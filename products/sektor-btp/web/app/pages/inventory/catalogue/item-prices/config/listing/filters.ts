/**
 * ItemPrice Listing Filters — Auto-generated from item-price.entity.json
 */

import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'priceType',
    label: 'directory.fields.priceType',
    type: 'text',
  },
  {
    key: 'currencyId',
    label: 'directory.fields.currencyId',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'currencies',
  },
];
