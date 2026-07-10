/**
 * InventoryTxLine Detail Fields — Auto-generated from inventory-tx-line.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { InventoryTxLine } from '../../models';

export const FIELDS: DetailFieldConfig<InventoryTxLine>[] = [
  {
    key: 'inventoryTxId',
    label: 'inventory.fields.inventoryTx',
    type: 'select',
    required: true,
    width: 'md',
    lookupKey: 'inventoryTxes',
    lookupEndpoint: '/api/v1/inventory-txs/lookup',
    lookupDisplayField: 'txNumber',
    lookupValueField: 'id',
    searchable: true,
    referenceRoute: '/inventory/mouvements/inventory-txes',
  },
  {
    key: 'lineNumber',
    label: 'inventory.fields.lineNumber',
    type: 'number',
    required: true,
    width: 'md',
    validators: [{ type: 'min', value: 1 }],
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
    key: 'unitPrice',
    label: 'inventory.fields.unitPrice',
    type: 'money-ma',
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'totalPrice',
    label: 'inventory.fields.totalPrice',
    type: 'money-ma',
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'notes',
    label: 'inventory.fields.notes',
    type: 'textarea',
    width: 'full',
    validators: [{ type: 'maxLength', value: 2000 }],
  },
];
