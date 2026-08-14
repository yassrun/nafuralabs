/**
 * UnitOfMeasure Listing Columns
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'code',
    label: 'measurement.fields.code',
    field: 'code',
    sortable: true,
  },
  {
    key: 'name',
    label: 'measurement.fields.name',
    field: 'name',
    sortable: true,
  },
  {
    key: 'uomCategoryId',
    label: 'measurement.fields.category',
    field: 'uomCategoryId',
  },
  {
    key: 'facteurVersBase',
    label: 'measurement.fields.facteurVersBase',
    field: 'facteurVersBase',
    type: 'number',
  },
  {
    key: 'estBase',
    label: 'measurement.fields.estBase',
    field: 'estBase',
    type: 'boolean',
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    field: 'isActive',
    type: 'boolean',
  },
];
