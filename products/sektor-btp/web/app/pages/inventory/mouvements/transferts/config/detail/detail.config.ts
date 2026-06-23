import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { DetailFieldConfig, StatusMachineConfig } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../../../inventory/models';

function buildTransfertFields(t: TranslateService): DetailFieldConfig<InventoryTx>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txDate',
      label: tr('inventory.mouvement.transfert.fields.txDate'),
      type: 'date',
      required: true,
      width: 'sm',
    },
    {
      key: 'sourceLocationId',
      label: tr('inventory.mouvement.transfert.fields.sourceLocationId'),
      type: 'select',
      lookupKey: 'allLocations',
      required: true,
      searchable: true,
      width: 'lg',
    },
    {
      key: 'destLocationId',
      label: tr('inventory.mouvement.transfert.fields.destLocationId'),
      type: 'select',
      lookupKey: 'allLocations',
      required: true,
      searchable: true,
      width: 'lg',
    },
    {
      key: 'chantierLocationId',
      label: tr('inventory.mouvement.transfert.fields.chantierLocationId'),
      type: 'select',
      lookupKey: 'chantierLocations',
      searchable: true,
      width: 'lg',
    },
    {
      key: 'phaseRef',
      label: tr('inventory.mouvement.transfert.fields.phaseRef'),
      type: 'text',
      width: 'md',
      visible: (formValue) => !!(formValue as InventoryTx).chantierLocationId,
    },
    {
      key: 'motifId',
      label: tr('inventory.mouvement.transfert.fields.motifId'),
      type: 'select',
      lookupKey: 'motifsTransfertChantier',
      searchable: true,
      width: 'md',
      visible: (formValue) => !!(formValue as InventoryTx).chantierLocationId,
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.transfert.fields.reference'),
      type: 'text',
      width: 'md',
    },
    {
      key: 'notes',
      label: tr('inventory.mouvement.transfert.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lines',
      label: tr('inventory.mouvement.transfert.fields.lines'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}

function buildTransfertStatusMachine(t: TranslateService): StatusMachineConfig<'BROUILLON' | 'VALIDE' | 'ANNULE'> {
  const tr = (k: string, p?: Record<string, unknown>) => t.instant(k, p);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr('inventory.mouvement.transfert.status.BROUILLON'), variant: 'warning' },
      VALIDE: { label: tr('inventory.mouvement.transfert.status.VALIDE'), variant: 'success' },
      ANNULE: { label: tr('inventory.mouvement.transfert.status.ANNULE'), variant: 'danger' },
    },
    transitions: [
      {
        from: 'BROUILLON',
        to: 'ANNULE',
        action: 'cancel',
        endpoint: 'cancel',
        label: tr('inventory.mouvement.transfert.transitions.rejectLabel'),
        icon: 'x-circle',
        variant: 'danger',
        permission: 'stock.transfert.cancel',
        confirm: {
          title: tr('inventory.mouvement.transfert.transitions.rejectTitle'),
          message: tr('inventory.mouvement.transfert.transitions.rejectMessage'),
          confirmLabel: tr('inventory.mouvement.transfert.transitions.rejectLabel'),
          requireNote: false,
        },
      },
      {
        from: 'BROUILLON',
        to: 'VALIDE',
        action: 'validate',
        endpoint: 'validate',
        label: tr('inventory.mouvement.transfert.transitions.validateLabel'),
        icon: 'check',
        variant: 'primary',
        permission: 'stock.transfert.validate',
        confirm: {
          title: tr('inventory.mouvement.transfert.transitions.validateTitle'),
          message: (item: unknown) => {
            const tx = item as InventoryTx;
            return tr('inventory.mouvement.transfert.transitions.validateMessage', {
              number: tx.txNumber ?? tr('inventory.mouvement.transfert.transitions.validateFallback'),
            });
          },
          confirmLabel: tr('inventory.mouvement.transfert.transitions.validateLabel'),
        },
      },
    ],
  };
}

export function buildTransfertDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<InventoryTx>(
    {
      entityName: tr('inventory.mouvement.transfert.entityName'),
      permissionPrefix: 'stock.transfert',
      fields: buildTransfertFields(t),
      statusMachine: buildTransfertStatusMachine(t),
      routes: {
        list: ['/inventory/mouvements/transferts'],
      },
    },
    {
      sections: [
        {
          id: 'header',
          title: tr('inventory.mouvement.transfert.sections.header'),
          fields: [
            'txDate',
            'sourceLocationId',
            'destLocationId',
            'chantierLocationId',
            'phaseRef',
            'motifId',
            'reference',
            'notes',
          ],
          columns: 2,
        },
        {
          id: 'lines',
          title: tr('inventory.mouvement.transfert.sections.lines'),
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
        hideActions: ['delete', 'duplicate'],
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
            permission: 'stock.transfert.update',
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
