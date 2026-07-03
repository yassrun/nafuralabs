import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { AOStatus, AppelOffre } from '@applications/erp/achats/models';
import { AO_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildAoFields } from './fields';
import { ROUTES } from './routes';
import { buildAoSections } from './sections';

export function buildAoStatusMachine(t: TranslateService): StatusMachineConfig<AOStatus> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr(AO_STATUS_KEYS.BROUILLON), variant: 'default' },
      PUBLIEE: { label: tr(AO_STATUS_KEYS.PUBLIEE), variant: 'info' },
      CLOTUREE: { label: tr(AO_STATUS_KEYS.CLOTUREE), variant: 'warning' },
      ATTRIBUEE: { label: tr(AO_STATUS_KEYS.ATTRIBUEE), variant: 'success' },
      INFRUCTUEUSE: { label: tr(AO_STATUS_KEYS.INFRUCTUEUSE), variant: 'danger' },
      ANNULEE: { label: tr(AO_STATUS_KEYS.ANNULEE), variant: 'danger' },
    },
    transitions: [
      {
        from: 'BROUILLON', to: 'PUBLIEE', action: 'publier', endpoint: 'publish',
        label: tr('achats.appelOffre.actions.publier'), icon: 'globe', variant: 'primary',
        permission: 'achats.ao.update',
        confirm: {
          title: tr('achats.appelOffre.confirms.publier.title'),
          message: tr('achats.appelOffre.confirms.publier.message'),
          confirmLabel: tr('achats.appelOffre.confirms.publier.confirmLabel'),
        },
      },
      {
        from: 'PUBLIEE', to: 'CLOTUREE', action: 'cloturer', endpoint: 'close',
        label: tr('achats.appelOffre.actions.cloturer'), icon: 'lock', variant: 'stroked',
        permission: 'achats.ao.update',
      },
      {
        from: 'CLOTUREE', to: 'INFRUCTUEUSE', action: 'infructueux', endpoint: 'no-award',
        label: tr('achats.appelOffre.actions.infructueux'), icon: 'x-circle', variant: 'danger',
        permission: 'achats.ao.update',
        confirm: {
          title: tr('achats.appelOffre.confirms.infructueux.title'),
          message: tr('achats.appelOffre.confirms.infructueux.message'),
          confirmLabel: tr('achats.appelOffre.confirms.infructueux.confirmLabel'),
        },
      },
    ],
  };
}

export function buildAoDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<AppelOffre>(
    {
      entityName: tr('achats.appelOffre.entityName'),
      icon: 'clipboard-list',
      permissionPrefix: 'achats.ao',
      fields: buildAoFields(t),
      routes: ROUTES,
      statusMachine: buildAoStatusMachine(t),
    },
    {
      sections: buildAoSections(t),
      statusMachineInActionsBar: true,
      actions: {
        appendActions: [
          {
            id: 'attribuer', label: tr('achats.appelOffre.actions.attribuer'), icon: 'award',
            scope: 'view', variant: 'primary', position: 'right', order: 10, showInModes: ['view'],
            visible: (ctx) => (ctx.item as AppelOffre | undefined)?.status === 'CLOTUREE',
          },
        ],
      },
      saveSuccessMessage: (item) =>
        tr('achats.appelOffre.toasts.saved').replace('{numero}', (item as AppelOffre).numero ?? ''),
      deleteConfirm: {
        title: tr('achats.appelOffre.deleteConfirm.title'),
        message: (item) =>
          tr('achats.appelOffre.deleteConfirm.message').replace('{numero}', (item as AppelOffre).numero ?? ''),
      },
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.AO, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
