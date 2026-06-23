import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { DetailFieldConfig } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../../../inventory/models';

function buildPerteFields(t: TranslateService): DetailFieldConfig<InventoryTx>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txDate',
      label: tr('inventory.mouvement.perte.fields.txDate'),
      type: 'date',
      required: true,
      width: 'sm',
    },
    {
      key: 'chantierLocationId',
      label: tr('inventory.mouvement.perte.fields.chantierLocationId'),
      type: 'select',
      lookupKey: 'chantierLocations',
      required: true,
      searchable: true,
      width: 'lg',
    },
    {
      key: 'motifId',
      label: tr('inventory.mouvement.perte.fields.motifId'),
      type: 'select',
      lookupKey: 'motifsPerte',
      required: true,
      searchable: true,
      width: 'md',
      hint: tr('inventory.mouvement.perte.fields.motifIdHint'),
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.perte.fields.reference'),
      type: 'text',
      width: 'md',
    },
    {
      key: 'notes',
      label: tr('inventory.mouvement.perte.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lines',
      label: tr('inventory.mouvement.perte.fields.lines'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}

export function buildPerteDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<InventoryTx>(
    {
      entityName: tr('inventory.mouvement.perte.entityName'),
      permissionPrefix: 'stock.perte',
      fields: buildPerteFields(t),
      routes: {
        list: ['/inventory/mouvements/pertes-chutes'],
      },
    },
    {
      sections: [
        {
          id: 'header',
          title: tr('inventory.mouvement.perte.sections.header'),
          fields: [
            'txDate',
            'chantierLocationId',
            'motifId',
            'reference',
            'notes',
          ],
          columns: 2,
        },
        {
          id: 'lines',
          title: tr('inventory.mouvement.perte.sections.lines'),
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
            visible: (ctx) => (ctx.item as InventoryTx | undefined)?.status === 'BROUILLON',
            permission: 'stock.perte.update',
          },
          {
            id: 'validate',
            label: tr('inventory.mouvement.perte.actions.validate'),
            icon: 'check-circle',
            scope: 'edit',
            variant: 'primary',
            position: 'right',
            order: 100,
            visible: (ctx) =>
              ctx.mode === 'edit' && (ctx.item as InventoryTx | undefined)?.status === 'BROUILLON',
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
              (ctx.mode === 'edit' && (ctx.item as InventoryTx | undefined)?.status === 'BROUILLON'),
            disabledTooltip: () => tr('inventory.mouvement.common.noChanges'),
          },
          delete: {
            visible: (ctx) => (ctx.item as InventoryTx | undefined)?.status === 'BROUILLON',
          },
        },
      },
    },
  );
}
