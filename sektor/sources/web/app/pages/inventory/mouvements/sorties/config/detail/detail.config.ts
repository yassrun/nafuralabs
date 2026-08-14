import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { DetailFieldConfig } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../../../inventory/models';

function buildSortieFields(t: TranslateService): DetailFieldConfig<InventoryTx>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txDate',
      label: tr('inventory.mouvement.sortie.fields.txDate'),
      type: 'date',
      required: true,
      width: 'sm',
    },
    {
      key: 'sourceLocationId',
      label: tr('inventory.mouvement.sortie.fields.sourceLocationId'),
      type: 'select',
      lookupKey: 'sourceLocations',
      required: true,
      searchable: true,
      width: 'lg',
      hint: tr('inventory.mouvement.sortie.fields.sourceLocationIdHint'),
    },
    {
      key: 'chantierBudgetId',
      label: tr('inventory.mouvement.sortie.fields.chantierBudgetId'),
      type: 'select',
      lookupKey: 'chantiersBudget',
      required: true,
      searchable: true,
      width: 'lg',
      hint: tr('inventory.mouvement.sortie.fields.chantierBudgetIdHint'),
    },
    {
      key: 'motifId',
      label: tr('inventory.mouvement.sortie.fields.motifId'),
      type: 'select',
      lookupKey: 'motifsSortie',
      required: true,
      searchable: true,
      width: 'md',
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.sortie.fields.reference'),
      type: 'text',
      width: 'md',
    },
    {
      key: 'notes',
      label: tr('inventory.mouvement.sortie.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lines',
      label: tr('inventory.mouvement.sortie.fields.lines'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}

export function buildSortieDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<InventoryTx>(
    {
      entityName: tr('inventory.mouvement.sortie.entityName'),
      permissionPrefix: 'stock.sortie',
      fields: buildSortieFields(t),
      routes: {
        list: ['/inventory/mouvements/sorties'],
      },
    },
    {
      sections: [
        {
          id: 'header',
          title: tr('inventory.mouvement.sortie.sections.header'),
          fields: ['txDate', 'sourceLocationId', 'chantierBudgetId', 'motifId', 'reference', 'notes'],
          columns: 2,
        },
        {
          id: 'lines',
          title: tr('inventory.mouvement.sortie.sections.lines'),
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
            permission: 'stock.sortie.update',
          },
          {
            id: 'validate',
            label: tr('inventory.mouvement.sortie.actions.validate'),
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
