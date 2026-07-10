import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { DetailFieldConfig } from '@lib/anatomy/types';

import type { InventaireTx } from '../../../../../../inventory/models';

function buildInventaireFields(t: TranslateService): DetailFieldConfig<InventaireTx>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txDate',
      label: tr('inventory.mouvement.inventaire.fields.txDate'),
      type: 'date',
      required: true,
      width: 'sm',
    },
    {
      key: 'destLocationId',
      label: tr('inventory.mouvement.inventaire.fields.destLocationId'),
      type: 'select',
      lookupKey: 'allLocations',
      required: true,
      searchable: true,
      width: 'lg',
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.inventaire.fields.reference'),
      type: 'text',
      width: 'md',
    },
    {
      key: 'notes',
      label: tr('inventory.mouvement.inventaire.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lines',
      label: tr('inventory.mouvement.inventaire.fields.lines'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}

export function buildInventaireDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<InventaireTx>(
    {
      entityName: tr('inventory.mouvement.inventaire.entityName'),
      permissionPrefix: 'stock.inventaire',
      fields: buildInventaireFields(t),
      routes: {
        list: ['/inventory/mouvements/inventaires'],
      },
    },
    {
      sections: [
        {
          id: 'header',
          title: tr('inventory.mouvement.inventaire.sections.header'),
          fields: ['txDate', 'destLocationId', 'reference', 'notes'],
          columns: 2,
        },
        {
          id: 'lines',
          title: tr('inventory.mouvement.inventaire.sections.lines'),
          fields: ['lines'],
          columns: 1,
        },
      ],
      defaultColumns: 2,
      viewModeAppearance: 'readonly',
      modes: {
        create: true,
        edit: true,
        view: true,
      },
      actions: {
        hideActions: ['duplicate'],
        appendActions: [
          {
            id: 'enter_edit',
            label: tr('inventory.mouvement.common.edit'),
            scope: 'view',
            variant: 'stroked',
            color: 'default',
            order: 95,
            position: 'right',
            showInModes: ['view'],
            visible: (ctx) => (ctx.item as InventaireTx | undefined)?.status === 'BROUILLON',
            permission: 'stock.inventaire.update',
          },
          {
            id: 'validate',
            label: tr('inventory.mouvement.inventaire.actions.validate'),
            icon: 'check-circle',
            scope: 'edit',
            variant: 'primary',
            position: 'right',
            order: 100,
            visible: (ctx) =>
              ctx.mode === 'edit' && (ctx.item as InventaireTx | undefined)?.status === 'BROUILLON',
          },
        ],
        overrideActions: {
          cancel: {
            label: tr('inventory.mouvement.common.back'),
            icon: '',
            variant: 'text',
            order: 1,
          },
          save: {
            label: tr('inventory.mouvement.common.save'),
            variant: 'stroked',
            color: 'default',
            order: 90,
            visible: (ctx) =>
              ctx.mode === 'create' ||
              (ctx.mode === 'edit' && (ctx.item as InventaireTx | undefined)?.status === 'BROUILLON'),
            disabledTooltip: () => tr('inventory.mouvement.common.noChanges'),
          },
          delete: {
            visible: (ctx) => (ctx.item as InventaireTx | undefined)?.status === 'BROUILLON',
          },
        },
      },
    },
  );
}
