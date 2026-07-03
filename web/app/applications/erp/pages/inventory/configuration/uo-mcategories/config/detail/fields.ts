/**
 * UoMCategory Detail Fields — Auto-generated from uo-mcategory.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { UoMCategory } from '../../models';

export const FIELDS: DetailFieldConfig<UoMCategory>[] = [
  {
    key: 'code',
    label: 'measurement.fields.categoryCode',
    type: 'text',
    required: true,
    readonlyOnEdit: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 50 }],
  },
  {
    key: 'name',
    label: 'measurement.fields.categoryName',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 200 }],
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
