/**
 * Item Listing Filters — Auto-generated from item.entity.json
 */

import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'code',
    label: 'directory.fields.code',
    type: 'text',
  },
  {
    key: 'name',
    label: 'directory.fields.name',
    type: 'text',
  },
  {
    key: 'itemTypeId',
    label: 'directory.fields.itemType',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'itemTypes',
  },
  {
    key: 'itemCategoryId',
    label: 'directory.fields.itemCategory',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'itemCategories',
  },
  {
    key: 'sku',
    label: 'directory.fields.sku',
    type: 'text',
  },
];
