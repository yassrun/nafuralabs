import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { InventoryTx } from '@applications/erp/inventory/models';

function buildFields(t: TranslateService): DetailFieldConfig<InventoryTx>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txType',
      label: tr('inventory.mouvement.tx.fields.txType'),
      type: 'select',
      lookupKey: 'txTypes',
      required: true,
      width: 'md',
    },
    {
      key: 'txDate',
      label: tr('inventory.mouvement.tx.fields.txDate'),
      type: 'date',
      required: true,
      width: 'sm',
    },
    {
      key: 'sourceLocationId',
      label: tr('inventory.mouvement.tx.fields.sourceLocationId'),
      type: 'select',
      lookupKey: 'locations',
      searchable: true,
      width: 'lg',
    },
    {
      key: 'destLocationId',
      label: tr('inventory.mouvement.tx.fields.destLocationId'),
      type: 'select',
      lookupKey: 'locations',
      searchable: true,
      width: 'lg',
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.tx.fields.reference'),
      type: 'text',
      width: 'md',
    },
    {
      key: 'notes',
      label: tr('inventory.mouvement.tx.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lines',
      label: tr('inventory.mouvement.tx.fields.lines'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}

export function buildInventoryTxDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<InventoryTx>(
    {
      entityName: tr('inventory.mouvement.tx.entityName'),
      permissionPrefix: 'stock.inventory-tx',
      fields: buildFields(t),
      routes: {
        list: ['/inventory/mouvements/inventory-txes'],
      },
    },
    {
      sections: [
        {
          id: 'header',
          title: tr('inventory.mouvement.tx.sections.header'),
          fields: ['txType', 'txDate', 'sourceLocationId', 'destLocationId', 'reference', 'notes'],
          columns: 2,
        },
        {
          id: 'lines',
          title: tr('inventory.mouvement.tx.sections.lines'),
          fields: ['lines'],
          columns: 1,
        },
      ],
      defaultColumns: 2,
      viewModeAppearance: 'readonly',
      modes: { create: true, edit: true, view: true },
      actions: {
        hideActions: ['duplicate'],
      },
      saveSuccessMessage: (item) =>
        t.instant('inventory.mouvement.tx.saveSuccess', { number: item.txNumber || '—' }),
      saveErrorMessage: tr('inventory.mouvement.tx.saveError'),
      deleteConfirm: {
        title: tr('inventory.mouvement.tx.deleteTitle'),
        message: tr('inventory.mouvement.tx.deleteMessage'),
        confirmLabel: tr('inventory.mouvement.common.save'),
      },
      deleteSuccessMessage: tr('inventory.mouvement.tx.deleteSuccess'),
    },
  );
}
