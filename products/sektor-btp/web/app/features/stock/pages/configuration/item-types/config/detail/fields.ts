/**
 * ItemType Detail Fields — Auto-generated from item-type.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { ItemType } from '../../models';

export const FIELDS: DetailFieldConfig<ItemType>[] = [
  {
    key: 'code',
    label: 'directory.fields.code',
    type: 'text',
    required: true,
    readonlyOnEdit: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 50 }],
  },
  {
    key: 'name',
    label: 'directory.fields.name',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 200 }],
  },
  {
    key: 'description',
    label: 'directory.fields.description',
    type: 'textarea',
    width: 'full',
    validators: [{ type: 'maxLength', value: 2000 }],
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    type: 'toggle',
    width: 'sm',
  },
];
