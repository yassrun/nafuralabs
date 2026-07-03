import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { FichePaie, StatutPaie } from '@applications/erp/rh/models';

import { buildPaieFields } from './fields';
import { ROUTES } from './routes';
import { buildPaieSections } from './sections';

export function buildPaieStatusMachine(t: TranslateService): StatusMachineConfig<StatutPaie> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr('rh.paie.statuses.BROUILLON'), variant: 'default' },
      VALIDEE: { label: tr('rh.paie.statuses.VALIDEE'), variant: 'info' },
      PAYEE: { label: tr('rh.paie.statuses.PAYEE'), variant: 'success' },
    },
    transitions: [
      {
        from: 'BROUILLON', to: 'VALIDEE', action: 'valider', endpoint: 'validate',
        label: tr('rh.paie.transitions.valider.label'), icon: 'check-circle', variant: 'primary',
        permission: 'rh.paie.valider',
        confirm: {
          title: tr('rh.paie.transitions.valider.confirmTitle'),
          message: tr('rh.paie.transitions.valider.confirmMessage'),
          confirmLabel: tr('rh.paie.transitions.valider.confirmLabel'),
        },
      },
      {
        from: 'VALIDEE', to: 'PAYEE', action: 'payer', endpoint: 'pay',
        label: tr('rh.paie.transitions.payer.label'), icon: 'banknote', variant: 'primary',
        permission: 'rh.paie.payer',
        confirm: {
          title: tr('rh.paie.transitions.payer.confirmTitle'),
          message: tr('rh.paie.transitions.payer.confirmMessage'),
          confirmLabel: tr('rh.paie.transitions.payer.confirmLabel'),
        },
      },
    ],
  };
}

export function buildPaieDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<FichePaie>(
    {
      entityName: tr('rh.paie.bulletin.titleSingular'),
      icon: 'banknote',
      permissionPrefix: 'rh.paie',
      fields: buildPaieFields(t),
      routes: ROUTES,
      statusMachine: buildPaieStatusMachine(t),
    },
    {
      sections: buildPaieSections(t),
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        t.instant('rh.paie.toasts.saved', { numero: (item as FichePaie).numero }),
      deleteConfirm: {
        title: tr('rh.paie.deleteConfirm.title'),
        message: (item) =>
          t.instant('rh.paie.deleteConfirm.message', { numero: (item as FichePaie).numero }),
      },
    },
  );
}
