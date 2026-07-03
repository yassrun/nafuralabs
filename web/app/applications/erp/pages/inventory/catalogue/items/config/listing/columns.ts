/**
 * Item Listing Columns — Auto-generated from item.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'code',
    label: 'directory.fields.code',
    field: 'code',
    sortable: true,
  },
  {
    key: 'name',
    label: 'directory.fields.name',
    field: 'name',
    sortable: true,
  },
  {
    key: 'itemTypeId',
    label: 'directory.fields.itemType',
    field: 'itemTypeId',
  },
  {
    key: 'sku',
    label: 'directory.fields.sku',
    field: 'sku',
    sortable: true,
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    field: 'isActive',
    type: 'boolean',
  },
];
