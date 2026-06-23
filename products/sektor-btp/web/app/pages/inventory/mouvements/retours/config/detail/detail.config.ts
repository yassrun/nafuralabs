import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { DetailFieldConfig, StatusMachineConfig } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../../../inventory/models';

function buildRetourFields(t: TranslateService): DetailFieldConfig<InventoryTx>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txDate',
      label: tr('inventory.mouvement.retour.fields.txDate'),
      type: 'date',
      required: true,
      width: 'sm',
    },
    {
      key: 'retourType',
      label: tr('inventory.mouvement.retour.fields.retourType'),
      type: 'select',
      lookupKey: 'retourTypes',
      required: true,
      width: 'md',
    },
    {
      key: 'sourceLocationId',
      label: tr('inventory.mouvement.retour.fields.sourceLocationId'),
      type: 'select',
      lookupKey: 'chantierLocations',
      required: true,
      searchable: true,
      width: 'lg',
      hint: tr('inventory.mouvement.retour.fields.sourceLocationIdHint'),
    },
    {
      key: 'destLocationId',
      label: tr('inventory.mouvement.retour.fields.destLocationId'),
      type: 'select',
      lookupKey: 'depotLocations',
      searchable: true,
      width: 'lg',
      hint: tr('inventory.mouvement.retour.fields.destLocationIdHint'),
    },
    {
      key: 'motifId',
      label: tr('inventory.mouvement.retour.fields.motifId'),
      type: 'select',
      lookupKey: 'motifsRetour',
      searchable: true,
      width: 'md',
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.retour.fields.reference'),
      type: 'text',
      width: 'md',
      hint: tr('inventory.mouvement.retour.fields.referenceHint'),
    },
    {
      key: 'notes',
      label: tr('inventory.mouvement.retour.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lines',
      label: tr('inventory.mouvement.retour.fields.lines'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}

function buildRetourStatusMachine(t: TranslateService): StatusMachineConfig<'BROUILLON' | 'VALIDE' | 'ANNULE'> {
  const tr = (k: string, p?: Record<string, unknown>) => t.instant(k, p);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr('inventory.mouvement.retour.status.BROUILLON'), variant: 'warning' },
      VALIDE: { label: tr('inventory.mouvement.retour.status.VALIDE'), variant: 'success' },
      ANNULE: { label: tr('inventory.mouvement.retour.status.ANNULE'), variant: 'danger' },
    },
    transitions: [
      {
        from: 'BROUILLON',
        to: 'ANNULE',
        action: 'cancel',
        endpoint: 'cancel',
        label: tr('inventory.mouvement.retour.transitions.rejectLabel'),
        icon: 'x-circle',
        variant: 'danger',
        permission: 'stock.retour.cancel',
        confirm: {
          title: tr('inventory.mouvement.retour.transitions.rejectTitle'),
          message: tr('inventory.mouvement.retour.transitions.rejectMessage'),
          confirmLabel: tr('inventory.mouvement.retour.transitions.rejectLabel'),
          requireNote: false,
        },
      },
      {
        from: 'BROUILLON',
        to: 'VALIDE',
        action: 'validate',
        endpoint: 'validate',
        label: tr('inventory.mouvement.retour.transitions.validateLabel'),
        icon: 'check',
        variant: 'primary',
        permission: 'stock.retour.validate',
        confirm: {
          title: tr('inventory.mouvement.retour.transitions.validateTitle'),
          message: (item: unknown) => {
            const tx = item as InventoryTx;
            return tr('inventory.mouvement.retour.transitions.validateMessage', {
              number: tx.txNumber ?? tr('inventory.mouvement.retour.transitions.validateFallback'),
            });
          },
          confirmLabel: tr('inventory.mouvement.retour.transitions.validateLabel'),
        },
      },
    ],
  };
}

export function buildRetourDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<InventoryTx>(
    {
      entityName: tr('inventory.mouvement.retour.entityName'),
      permissionPrefix: 'stock.retour',
      fields: buildRetourFields(t),
      statusMachine: buildRetourStatusMachine(t),
      routes: {
        list: ['/inventory/mouvements/retours'],
      },
    },
    {
      sections: [
        {
          id: 'header',
          title: tr('inventory.mouvement.retour.sections.header'),
          fields: [
            'txDate',
            'retourType',
            'sourceLocationId',
            'destLocationId',
            'motifId',
            'reference',
            'notes',
          ],
          columns: 2,
        },
        {
          id: 'lines',
          title: tr('inventory.mouvement.retour.sections.lines'),
          fields: ['lines'],
          columns: 1,
        },
      ],
      defaultColumns: 2,
      viewModeAppearance: 'readonly',
      statusMachineInActionsBar: true,
      statusMachinePosition: 'right',
      modes: {
        create: true,
        edit: true,
        view: true,
      },
      actions: {
        hideActions: ['duplicate', 'delete'],
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
            permission: 'stock.retour.update',
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
        },
      },
    },
  );
}
