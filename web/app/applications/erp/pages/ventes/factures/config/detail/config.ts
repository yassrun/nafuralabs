import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import { FACTURE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import type {
  FactureClient,
  FactureStatus,
} from '@applications/erp/ventes/models';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildFactureFields } from './fields';
import { ROUTES } from './routes';
import { buildFactureSections } from './sections';

export function buildFactureStatusMachine(
  t: TranslateService,
): StatusMachineConfig<FactureStatus> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr(FACTURE_STATUS_KEYS.BROUILLON), variant: 'default' },
      EMISE: { label: tr(FACTURE_STATUS_KEYS.EMISE), variant: 'info' },
      PARTIELLEMENT_PAYEE: {
        label: tr(FACTURE_STATUS_KEYS.PARTIELLEMENT_PAYEE),
        variant: 'warning',
      },
      PAYEE: { label: tr(FACTURE_STATUS_KEYS.PAYEE), variant: 'success' },
      EN_LITIGE: { label: tr(FACTURE_STATUS_KEYS.EN_LITIGE), variant: 'danger' },
      AVOIRISEE: { label: tr(FACTURE_STATUS_KEYS.AVOIRISEE), variant: 'default' },
      ANNULEE: { label: tr(FACTURE_STATUS_KEYS.ANNULEE), variant: 'default' },
    },
    transitions: [
      {
        from: 'BROUILLON',
        to: 'EMISE',
        action: 'emit',
        endpoint: 'emit',
        label: tr('ventes.facture.actions.emit'),
        icon: 'send',
        variant: 'primary',
        permission: 'ventes.facture.emettre',
        confirm: {
          title: tr('ventes.facture.confirm.emit.title'),
          message: tr('ventes.facture.confirm.emit.message'),
          confirmLabel: tr('ventes.facture.confirm.emit.confirmLabel'),
        },
      },
      {
        from: ['EMISE', 'PARTIELLEMENT_PAYEE'],
        to: 'EN_LITIGE',
        action: 'litige',
        endpoint: 'litige',
        label: tr('ventes.facture.actions.litige'),
        icon: 'alert-triangle',
        variant: 'danger',
        permission: 'ventes.facture.update',
        confirm: {
          title: tr('ventes.facture.confirm.litige.title'),
          message: tr('ventes.facture.confirm.litige.message'),
          confirmLabel: tr('ventes.facture.confirm.litige.confirmLabel'),
          requireNote: true,
          notePlaceholder: tr('ventes.facture.confirm.litige.notePlaceholder'),
        },
      },
      {
        from: 'EN_LITIGE',
        to: 'EMISE',
        action: 'resoudre_litige',
        endpoint: 'resoudre',
        label: tr('ventes.facture.actions.resolveLitige'),
        icon: 'check-circle',
        variant: 'primary',
        permission: 'ventes.facture.update',
      },
      {
        from: 'BROUILLON',
        to: 'ANNULEE',
        action: 'cancel',
        endpoint: 'cancel',
        label: tr('ventes.facture.actions.cancel'),
        icon: 'x',
        variant: 'secondary',
        permission: 'ventes.facture.update',
        confirm: {
          title: tr('ventes.facture.confirm.cancel.title'),
          message: tr('ventes.facture.confirm.cancel.message'),
          confirmLabel: tr('ventes.facture.confirm.cancel.confirmLabel'),
        },
      },
    ],
  };
}

export function buildFactureDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<FactureClient>(
    {
      entityName: tr('ventes.facture.entityName'),
      icon: 'file-text',
      permissionPrefix: 'ventes.facture',
      fields: buildFactureFields(t),
      routes: ROUTES,
      statusMachine: buildFactureStatusMachine(t),
    },
    {
      sections: buildFactureSections(t),
      statusMachineInActionsBar: true,
      statusMachinePosition: 'right',
      actions: {
        appendActions: [
          {
            id: 'add_encaissement',
            label: tr('ventes.facture.actions.addEncaissement'),
            icon: 'plus-circle',
            scope: 'edit+view',
            variant: 'primary',
            position: 'right',
            order: 60,
            showInModes: ['edit', 'view'],
            permission: 'ventes.facture.update',
            visible: (ctx) => {
              const f = ctx.item as FactureClient | undefined;
              return (
                !!f && (f.status === 'EMISE' || f.status === 'PARTIELLEMENT_PAYEE')
              );
            },
          },
          {
            id: 'print_facture',
            label: tr('ventes.facture.actions.print'),
            icon: 'printer',
            scope: 'edit+view',
            variant: 'stroked',
            position: 'left',
            order: 50,
            showInModes: ['edit', 'view'],
          },
          {
            id: 'creer_avoir',
            label: tr('ventes.facture.actions.creerAvoir'),
            icon: 'corner-down-left',
            scope: 'edit+view',
            variant: 'stroked',
            position: 'right',
            order: 70,
            showInModes: ['edit', 'view'],
            permission: 'ventes.avoir.create',
            visible: (ctx) => {
              const f = ctx.item as FactureClient | undefined;
              return (
                !!f &&
                ['EMISE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_LITIGE'].includes(
                  f.status,
                )
              );
            },
          },
        ],
      },
      saveSuccessMessage: (item) =>
        t.instant('ventes.facture.toasts.saved', {
          numero: (item as FactureClient).numero,
        }),
      deleteConfirm: {
        title: tr('ventes.facture.confirm.delete.title'),
        message: (item) =>
          t.instant('ventes.facture.confirm.delete.message', {
            numero: (item as FactureClient).numero,
          }),
      },
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.FACTURE, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
