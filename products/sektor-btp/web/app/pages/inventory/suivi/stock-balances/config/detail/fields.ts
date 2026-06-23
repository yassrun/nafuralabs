/**
 * StockBalance Detail Fields — Auto-generated from stock-balance.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { StockBalance } from '../../models';

export const FIELDS: DetailFieldConfig<StockBalance>[] = [
  {
    key: 'warehouseId',
    label: 'inventory.fields.warehouse',
    type: 'select',
    required: true,
    width: 'md',
    lookupKey: 'locations',
    lookupEndpoint: '/api/v1/locations/lookup',
    lookupDisplayField: 'name',
    lookupValueField: 'id',
    searchable: true,
    referenceRoute: '/inventory/configuration/depots',
  },
  {
    key: 'itemId',
    label: 'inventory.fields.item',
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
    key: 'quantity',
    label: 'inventory.fields.quantity',
    type: 'number',
    required: true,
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'reservedQuantity',
    label: 'inventory.fields.reservedQuantity',
    type: 'number',
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'availableQuantity',
    label: 'inventory.fields.availableQuantity',
    type: 'number',
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'lastCountDate',
    label: 'inventory.fields.lastCountDate',
    type: 'date',
    width: 'md',
  },
];
