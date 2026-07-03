/**
 * Item Detail Fields — Auto-generated from item.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { Item } from '../../models';

export const FIELDS: DetailFieldConfig<Item>[] = [
  {
    key: 'code',
    label: 'directory.fields.code',
    type: 'text',
    readonlyOnEdit: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 50 }],
  },
  {
    key: 'itemTypeId',
    label: 'directory.fields.itemType',
    type: 'select',
    width: 'md',
    lookupKey: 'itemTypes',
    lookupEndpoint: '/api/v1/item-types/lookup',
    lookupDisplayField: 'name',
    lookupValueField: 'id',
    searchable: true,
    clearable: true,
    referenceRoute: '/inventory/configuration/item-types',
  },
  {
    key: 'unitOfMeasureId',
    label: 'directory.fields.unitOfMeasure',
    type: 'select',
    width: 'md',
    lookupKey: 'unitOfMeasures',
    lookupEndpoint: '/api/v1/units-of-measure/lookup',
    lookupDisplayField: 'name',
    lookupValueField: 'id',
    searchable: true,
    clearable: true,
    referenceRoute: '/inventory/units-of-measure',
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    type: 'toggle',
    width: 'sm',
  },
  {
    key: 'name',
    label: 'directory.fields.name',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 255 }],
  },
  {
    key: 'description',
    label: 'directory.fields.description',
    type: 'textarea',
    width: 'full',
    validators: [{ type: 'maxLength', value: 2000 }],
  },
  {
    key: 'itemCategoryId',
    label: 'directory.fields.itemCategory',
    type: 'select',
    width: 'md',
    lookupKey: 'itemCategories',
    lookupEndpoint: '/api/v1/item-categories/lookup',
    lookupDisplayField: 'name',
    lookupValueField: 'id',
    searchable: true,
    clearable: true,
    referenceRoute: '/inventory/configuration/item-categories',
  },
  {
    key: 'sku',
    label: 'directory.fields.sku',
    type: 'text',
    width: 'md',
    validators: [{ type: 'maxLength', value: 100 }],
  },
];
