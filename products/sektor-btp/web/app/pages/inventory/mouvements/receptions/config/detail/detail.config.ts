import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../../../inventory/models';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildReceptionDetailFields } from './fields';
import { RECEPTION_DETAIL_ROUTES } from './routes';
import { buildReceptionDetailSections } from './sections';

export function buildReceptionStatusMachine(
  t: TranslateService,
): StatusMachineConfig<'BROUILLON' | 'VALIDE' | 'ANNULE'> {
  const tr = (k: string, p?: Record<string, unknown>) => t.instant(k, p);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr('inventory.mouvement.reception.status.BROUILLON'), variant: 'warning' },
      VALIDE: { label: tr('inventory.mouvement.reception.status.VALIDE'), variant: 'success' },
      ANNULE: { label: tr('inventory.mouvement.reception.status.ANNULE'), variant: 'danger' },
    },
    transitions: [
      {
        from: 'BROUILLON',
        to: 'ANNULE',
        action: 'cancel',
        endpoint: 'cancel',
        label: tr('inventory.mouvement.reception.transitions.rejectLabel'),
        icon: 'x-circle',
        variant: 'danger',
        permission: 'stock.reception.cancel',
        confirm: {
          title: tr('inventory.mouvement.reception.transitions.rejectTitle'),
          message: tr('inventory.mouvement.reception.transitions.rejectMessage'),
          confirmLabel: tr('inventory.mouvement.reception.transitions.rejectLabel'),
          requireNote: false,
        },
      },
      {
        from: 'BROUILLON',
        to: 'VALIDE',
        action: 'validate',
        endpoint: 'validate',
        label: tr('inventory.mouvement.reception.transitions.validateLabel'),
        icon: 'check',
        variant: 'primary',
        permission: 'stock.reception.validate',
        confirm: {
          title: tr('inventory.mouvement.reception.transitions.validateTitle'),
          message: (item: unknown) => {
            const tx = item as InventoryTx;
            return tr('inventory.mouvement.reception.transitions.validateMessage', {
              number: tx.txNumber ?? tr('inventory.mouvement.reception.transitions.validateFallback'),
            });
          },
          confirmLabel: tr('inventory.mouvement.reception.transitions.validateLabel'),
        },
      },
    ],
  };
}

export function buildReceptionDetailConfig(t: TranslateService) {
  const tr = (k: string, p?: Record<string, unknown>) => t.instant(k, p);
  return buildDetailConfig<InventoryTx>(
    {
      entityName: tr('inventory.mouvement.reception.entityNamePlural'),
      icon: 'download',
      fields: buildReceptionDetailFields(t),
      routes: RECEPTION_DETAIL_ROUTES,
      statusMachine: buildReceptionStatusMachine(t),
    },
    {
      sections: buildReceptionDetailSections(t),
      modes: { create: true, edit: true, view: true },
      viewModeAppearance: 'readonly',
      statusMachineInActionsBar: true,
      statusMachinePosition: 'right',
      actions: {
        hide: ['delete', 'duplicate'],
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
            permission: 'stock.reception.update',
          },
          {
            id: 'scan_bl',
            label: tr('inventory.mouvement.reception.actions.scanBl'),
            icon: 'file-plus',
            scope: 'create+edit',
            variant: 'primary',
            position: 'right',
            order: 80,
            showInModes: ['create', 'edit'],
            permission: 'stock.reception.create',
          },
        ],
        override: {
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
              ctx.mode === 'create' || (ctx.mode === 'edit' && (ctx.item as InventoryTx | undefined)?.status === 'BROUILLON'),
            disabledTooltip: () => tr('inventory.mouvement.common.noChanges'),
          },
        },
      },
      saveSuccessMessage: (item) =>
        tr('inventory.mouvement.reception.saveSuccess', { number: (item as InventoryTx).txNumber }),
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.RECEPTION, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
