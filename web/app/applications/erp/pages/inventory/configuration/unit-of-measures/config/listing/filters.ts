/**
 * UnitOfMeasure Listing Filters — Auto-generated from unit-of-measure.entity.json
 */

import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'code',
    label: 'measurement.fields.code',
    type: 'text',
  },
  {
    key: 'name',
    label: 'measurement.fields.name',
    type: 'text',
  },
  {
    key: 'uomCategoryId',
    label: 'measurement.fields.category',
    type: 'select',
    placeholder: 'All',
    lookupKey: 'uoMCategories',
  },
];
