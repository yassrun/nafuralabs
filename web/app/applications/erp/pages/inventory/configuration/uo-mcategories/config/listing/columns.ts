/**
 * UoMCategory Listing Columns — Auto-generated from uo-mcategory.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'code',
    label: 'measurement.fields.categoryCode',
    field: 'code',
    sortable: true,
  },
  {
    key: 'name',
    label: 'measurement.fields.categoryName',
    field: 'name',
    sortable: true,
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    field: 'isActive',
    type: 'boolean',
  },
];
