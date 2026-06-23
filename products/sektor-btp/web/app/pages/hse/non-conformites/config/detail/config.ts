import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { NonConformite, StatutNC } from '@applications/erp/hse/models';
import { NC_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

import { buildNcFields } from './fields';
import { ROUTES } from './routes';
import { buildNcSections } from './sections';

export function buildNcStatusMachine(t: TranslateService): StatusMachineConfig<StatutNC> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      OUVERTE: { label: tr(NC_STATUS_KEYS.OUVERTE), variant: 'danger' },
      EN_COURS: { label: tr(NC_STATUS_KEYS.EN_COURS), variant: 'warning' },
      VERIFIEE: { label: tr(NC_STATUS_KEYS.VERIFIEE), variant: 'info' },
      CLOTUREE: { label: tr(NC_STATUS_KEYS.CLOTUREE), variant: 'default' },
    },
    transitions: [
      {
        from: 'OUVERTE', to: 'EN_COURS', action: 'traiter', endpoint: 'process',
        label: tr('hse.nonConformite.actions.traiter'), icon: 'play', variant: 'primary',
        permission: 'hse.nc.update',
        confirm: {
          title: tr('hse.nonConformite.confirms.traiter.title'),
          message: tr('hse.nonConformite.confirms.traiter.message'),
          confirmLabel: tr('hse.nonConformite.confirms.traiter.confirmLabel'),
        },
      },
      {
        from: 'EN_COURS', to: 'VERIFIEE', action: 'verifier', endpoint: 'verify',
        label: tr('hse.nonConformite.actions.verifier'), icon: 'eye', variant: 'primary',
        permission: 'hse.nc.update',
        confirm: {
          title: tr('hse.nonConformite.confirms.verifier.title'),
          message: tr('hse.nonConformite.confirms.verifier.message'),
          confirmLabel: tr('hse.nonConformite.confirms.verifier.confirmLabel'),
        },
      },
      {
        from: 'VERIFIEE', to: 'CLOTUREE', action: 'cloturer', endpoint: 'close',
        label: tr('hse.nonConformite.actions.cloturer'), icon: 'check-circle', variant: 'primary',
        permission: 'hse.nc.update',
        confirm: {
          title: tr('hse.nonConformite.confirms.cloturer.title'),
          message: tr('hse.nonConformite.confirms.cloturer.message'),
          confirmLabel: tr('hse.nonConformite.confirms.cloturer.confirmLabel'),
        },
      },
    ],
  };
}

export function buildNcDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<NonConformite>(
    {
      entityName: tr('hse.nonConformite.entityName'),
      icon: 'shield-x',
      permissionPrefix: 'hse.nc',
      fields: buildNcFields(t),
      routes: ROUTES,
      statusMachine: buildNcStatusMachine(t),
    },
    {
      sections: buildNcSections(t),
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        tr('hse.nonConformite.toasts.saved').replace('{numero}', (item as NonConformite).numero ?? ''),
      deleteConfirm: {
        title: tr('hse.nonConformite.deleteConfirm.title'),
        message: (item) =>
          tr('hse.nonConformite.deleteConfirm.message').replace('{numero}', (item as NonConformite).numero ?? ''),
      },
    },
  );
}
