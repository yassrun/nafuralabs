import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import { AVOIR_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import type { Avoir, AvoirStatus } from '@applications/erp/ventes/models';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildAvoirFields } from './fields';
import { ROUTES } from './routes';
import { buildAvoirSections } from './sections';

export function buildAvoirStatusMachine(
  t: TranslateService,
): StatusMachineConfig<AvoirStatus> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr(AVOIR_STATUS_KEYS.BROUILLON), variant: 'default' },
      EMIS: { label: tr(AVOIR_STATUS_KEYS.EMIS), variant: 'info' },
      IMPUTE: { label: tr(AVOIR_STATUS_KEYS.IMPUTE), variant: 'success' },
      REMBOURSE: { label: tr(AVOIR_STATUS_KEYS.REMBOURSE), variant: 'success' },
      ANNULE: { label: tr(AVOIR_STATUS_KEYS.ANNULE), variant: 'default' },
    },
    transitions: [
      {
        from: 'BROUILLON',
        to: 'EMIS',
        action: 'emit',
        endpoint: 'emit',
        label: tr('ventes.avoir.actions.emit'),
        icon: 'send',
        variant: 'primary',
        permission: 'ventes.avoir.emettre',
        confirm: {
          title: tr('ventes.avoir.confirm.emit.title'),
          message: tr('ventes.avoir.confirm.emit.message'),
          confirmLabel: tr('ventes.avoir.confirm.emit.confirmLabel'),
        },
      },
      {
        from: 'EMIS',
        to: 'IMPUTE',
        action: 'imputer',
        endpoint: 'imputer',
        label: tr('ventes.avoir.actions.impute'),
        icon: 'corner-down-left',
        variant: 'primary',
        permission: 'ventes.avoir.update',
        confirm: {
          title: tr('ventes.avoir.confirm.imputer.title'),
          message: tr('ventes.avoir.confirm.imputer.message'),
          confirmLabel: tr('ventes.avoir.confirm.imputer.confirmLabel'),
        },
      },
      {
        from: 'EMIS',
        to: 'REMBOURSE',
        action: 'rembourser',
        endpoint: 'rembourser',
        label: tr('ventes.avoir.actions.rembourser'),
        icon: 'rotate-ccw',
        variant: 'secondary',
        permission: 'ventes.avoir.update',
        confirm: {
          title: tr('ventes.avoir.confirm.rembourser.title'),
          message: tr('ventes.avoir.confirm.rembourser.message'),
          confirmLabel: tr('ventes.avoir.confirm.rembourser.confirmLabel'),
        },
      },
      {
        from: ['BROUILLON', 'EMIS'],
        to: 'ANNULE',
        action: 'cancel',
        endpoint: 'cancel',
        label: tr('ventes.avoir.actions.cancel'),
        icon: 'x',
        variant: 'secondary',
        permission: 'ventes.avoir.update',
        confirm: {
          title: tr('ventes.avoir.confirm.cancel.title'),
          message: tr('ventes.avoir.confirm.cancel.message'),
          confirmLabel: tr('ventes.avoir.confirm.cancel.confirmLabel'),
        },
      },
    ],
  };
}

export function buildAvoirDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Avoir>(
    {
      entityName: tr('ventes.avoir.entityName'),
      icon: 'corner-down-left',
      permissionPrefix: 'ventes.avoir',
      fields: buildAvoirFields(t),
      routes: ROUTES,
      statusMachine: buildAvoirStatusMachine(t),
    },
    {
      sections: buildAvoirSections(t),
      statusMachineInActionsBar: true,
      statusMachinePosition: 'right',
      actions: {
        appendActions: [
          {
            id: 'print_avoir',
            label: tr('ventes.avoir.actions.print'),
            icon: 'printer',
            scope: 'view',
            variant: 'stroked',
            position: 'left',
            order: 50,
            showInModes: ['view'],
          },
        ],
      },
      saveSuccessMessage: (item) =>
        t.instant('ventes.avoir.toasts.saved', { numero: (item as Avoir).numero }),
      deleteConfirm: {
        title: tr('ventes.avoir.confirm.delete.title'),
        message: (item) =>
          t.instant('ventes.avoir.confirm.delete.message', {
            numero: (item as Avoir).numero,
          }),
      },
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.AVOIR, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
