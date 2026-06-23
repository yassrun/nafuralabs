import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { Conge, StatutConge } from '@applications/erp/rh/models';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildCongeFields } from './fields';
import { ROUTES } from './routes';
import { buildCongeSections } from './sections';

export function buildCongeStatusMachine(t: TranslateService): StatusMachineConfig<StatutConge> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      DEMANDE: { label: tr('rh.conge.statuses.DEMANDE'), variant: 'info' },
      APPROUVE: { label: tr('rh.conge.statuses.APPROUVE'), variant: 'success' },
      REFUSE: { label: tr('rh.conge.statuses.REFUSE'), variant: 'danger' },
      EN_COURS: { label: tr('rh.conge.statuses.EN_COURS'), variant: 'info' },
      SOLDE: { label: tr('rh.conge.statuses.SOLDE'), variant: 'default' },
    },
    transitions: [
      {
        from: 'DEMANDE', to: 'APPROUVE', action: 'approuver', endpoint: 'approve',
        label: tr('rh.conge.transitions.approuver.label'), icon: 'check-circle', variant: 'primary',
        permission: 'rh.conges.approuver',
        confirm: {
          title: tr('rh.conge.transitions.approuver.confirmTitle'),
          message: tr('rh.conge.transitions.approuver.confirmMessage'),
          confirmLabel: tr('rh.conge.transitions.approuver.confirmLabel'),
        },
      },
      {
        from: 'DEMANDE', to: 'REFUSE', action: 'refuser', endpoint: 'refuse',
        label: tr('rh.conge.transitions.refuser.label'), icon: 'x-circle', variant: 'danger',
        permission: 'rh.conges.approuver',
        confirm: {
          title: tr('rh.conge.transitions.refuser.confirmTitle'),
          message: tr('rh.conge.transitions.refuser.confirmMessage'),
          confirmLabel: tr('rh.conge.transitions.refuser.confirmLabel'),
          requireNote: true,
          notePlaceholder: tr('rh.conge.transitions.refuser.notePlaceholder'),
        },
      },
      {
        from: 'APPROUVE', to: 'EN_COURS', action: 'demarrer', endpoint: 'start',
        label: tr('rh.conge.transitions.demarrer.label'), icon: 'play-circle', variant: 'primary',
        permission: 'rh.conges.update',
        confirm: {
          title: tr('rh.conge.transitions.demarrer.confirmTitle'),
          message: tr('rh.conge.transitions.demarrer.confirmMessage'),
          confirmLabel: tr('rh.conge.transitions.demarrer.confirmLabel'),
        },
      },
      {
        from: 'EN_COURS', to: 'SOLDE', action: 'solder', endpoint: 'close',
        label: tr('rh.conge.transitions.solder.label'), icon: 'check-square', variant: 'primary',
        permission: 'rh.conges.update',
        confirm: {
          title: tr('rh.conge.transitions.solder.confirmTitle'),
          message: tr('rh.conge.transitions.solder.confirmMessage'),
          confirmLabel: tr('rh.conge.transitions.solder.confirmLabel'),
        },
      },
    ],
  };
}

export function buildCongeDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Conge>(
    {
      entityName: tr('rh.conge.titleSingular'),
      icon: 'calendar-off',
      permissionPrefix: 'rh.conges',
      fields: buildCongeFields(t),
      routes: ROUTES,
      statusMachine: buildCongeStatusMachine(t),
    },
    {
      sections: buildCongeSections(t),
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        t.instant('rh.conge.toasts.saved', { numero: (item as Conge).numero }),
      deleteConfirm: {
        title: tr('rh.conge.deleteConfirm.title'),
        message: (item) =>
          t.instant('rh.conge.deleteConfirm.message', { numero: (item as Conge).numero }),
      },
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.CONGE, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
