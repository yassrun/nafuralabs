/**
 * UnitOfMeasure Detail Fields — Auto-generated from unit-of-measure.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { UnitOfMeasure } from '../../models';

export const FIELDS: DetailFieldConfig<UnitOfMeasure>[] = [
  {
    key: 'code',
    label: 'measurement.fields.code',
    type: 'text',
    required: true,
    readonlyOnEdit: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 30 }],
  },
  {
    key: 'name',
    label: 'measurement.fields.name',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 100 }],
  },
  {
    key: 'uomCategoryId',
    label: 'measurement.fields.category',
    type: 'select',
    width: 'md',
    lookupKey: 'uoMCategories',
    lookupEndpoint: '/api/v1/uom-categories/lookup',
    lookupDisplayField: 'name',
    lookupValueField: 'id',
    searchable: true,
    clearable: true,
    referenceRoute: '/inventory/configuration/uo-mcategories',
  },
  {
    key: 'description',
    label: 'common.fields.description',
    type: 'textarea',
    width: 'full',
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    type: 'toggle',
    width: 'sm',
  },
];
