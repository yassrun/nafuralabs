import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { ContratAchat, ContratAchatStatus } from '@applications/erp/achats/models';
import { CT_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildContratFields } from './fields';
import { ROUTES } from './routes';
import { buildContratSections } from './sections';

function buildCtStatusMachine(t: TranslateService): StatusMachineConfig<ContratAchatStatus> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr(CT_STATUS_KEYS.BROUILLON), variant: 'default' },
      SIGNE: { label: tr(CT_STATUS_KEYS.SIGNE), variant: 'info' },
      EN_COURS: { label: tr(CT_STATUS_KEYS.EN_COURS), variant: 'success' },
      ECHU: { label: tr(CT_STATUS_KEYS.ECHU), variant: 'warning' },
      RESILIE: { label: tr(CT_STATUS_KEYS.RESILIE), variant: 'danger' },
    },
    transitions: [
      {
        from: 'BROUILLON', to: 'SIGNE', action: 'signer', endpoint: 'sign',
        label: tr('achats.contrat.actions.signer'), icon: 'pen-tool', variant: 'primary',
        permission: 'achats.contrat.update',
        confirm: {
          title: tr('achats.contrat.confirms.signer.title'),
          message: tr('achats.contrat.confirms.signer.message'),
          confirmLabel: tr('achats.contrat.confirms.signer.confirmLabel'),
        },
      },
      {
        from: 'SIGNE', to: 'EN_COURS', action: 'activer', endpoint: 'activate',
        label: tr('achats.contrat.actions.activer'), icon: 'play', variant: 'primary',
        permission: 'achats.contrat.update',
      },
      {
        from: 'EN_COURS', to: 'RESILIE', action: 'resilier', endpoint: 'terminate',
        label: tr('achats.contrat.actions.resilier'), icon: 'alert-triangle', variant: 'danger',
        permission: 'achats.contrat.update',
        confirm: {
          title: tr('achats.contrat.confirms.resilier.title'),
          message: tr('achats.contrat.confirms.resilier.message'),
          confirmLabel: tr('achats.contrat.confirms.resilier.confirmLabel'),
          requireNote: true,
          notePlaceholder: tr('achats.contrat.confirms.resilier.notePlaceholder'),
        },
      },
    ],
  };
}

export function buildContratDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<ContratAchat>(
    {
      entityName: tr('achats.contrat.entityName'),
      icon: 'file-check',
      permissionPrefix: 'achats.contrat',
      fields: buildContratFields(t),
      routes: ROUTES,
      statusMachine: buildCtStatusMachine(t),
    },
    {
      sections: buildContratSections(t),
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        tr('achats.contrat.toasts.saved').replace('{numero}', (item as ContratAchat).numero ?? ''),
      deleteConfirm: {
        title: tr('achats.contrat.deleteConfirm.title'),
        message: (item) =>
          tr('achats.contrat.deleteConfirm.message').replace('{numero}', (item as ContratAchat).numero ?? ''),
      },
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.CONTRAT_ACHAT, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
