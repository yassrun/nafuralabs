/**
 * ItemPrice Detail Fields — Auto-generated from item-price.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { ItemPrice } from '../../models';

export const FIELDS: DetailFieldConfig<ItemPrice>[] = [
  {
    key: 'itemId',
    label: 'directory.fields.itemId',
    type: 'select',
    required: true,
    width: 'md',
    lookupKey: 'items',
    lookupEndpoint: '/api/v1/items/lookup',
    lookupDisplayField: 'name',
    lookupValueField: 'id',
    searchable: true,
    referenceRoute: '/inventory/catalogue/items',
  },
  {
    key: 'priceType',
    label: 'directory.fields.priceType',
    type: 'select',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 30 }],
  },
  {
    key: 'currencyId',
    label: 'directory.fields.currencyId',
    type: 'select',
    required: true,
    width: 'md',
    lookupKey: 'currencies',
    lookupEndpoint: '/api/v1/currencies/lookup',
    lookupDisplayField: 'code',
    lookupValueField: 'id',
    searchable: true,
    referenceRoute: '/finance/configuration/currencies',
  },
  {
    key: 'unitPrice',
    label: 'directory.fields.unitPrice',
    type: 'money-ma',
    required: true,
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'minQuantity',
    label: 'directory.fields.minQuantity',
    type: 'number',
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'effectiveFrom',
    label: 'directory.fields.effectiveFrom',
    type: 'date',
    required: true,
    width: 'md',
  },
  {
    key: 'effectiveTo',
    label: 'directory.fields.effectiveTo',
    type: 'date',
    width: 'md',
  },
];
