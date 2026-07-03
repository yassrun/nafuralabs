import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { Employe, StatutEmploye } from '@applications/erp/rh/models';

import { buildEmployeFields } from './fields';
import { ROUTES } from './routes';
import { buildEmployeSections } from './sections';

export function buildEmployeStatusMachine(t: TranslateService): StatusMachineConfig<StatutEmploye> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'statut',
    statuses: {
      ACTIF: { label: tr('rh.employe.statuses.ACTIF'), variant: 'success' },
      SUSPENDU: { label: tr('rh.employe.statuses.SUSPENDU'), variant: 'warning' },
      SOLDE: { label: tr('rh.employe.statuses.SOLDE'), variant: 'default' },
    },
    transitions: [
      {
        from: 'ACTIF', to: 'SUSPENDU', action: 'suspendre', endpoint: 'suspend',
        label: tr('rh.employe.transitions.suspendre.label'), icon: 'pause-circle', variant: 'secondary',
        permission: 'rh.employes.update',
        confirm: {
          title: tr('rh.employe.transitions.suspendre.confirmTitle'),
          message: tr('rh.employe.transitions.suspendre.confirmMessage'),
          confirmLabel: tr('rh.employe.transitions.suspendre.confirmLabel'),
        },
      },
      {
        from: 'ACTIF', to: 'SOLDE', action: 'solde', endpoint: 'solde',
        label: tr('rh.employe.transitions.solde.label'), icon: 'user-x', variant: 'danger',
        permission: 'rh.employes.update',
        confirm: {
          title: tr('rh.employe.transitions.solde.confirmTitle'),
          message: tr('rh.employe.transitions.solde.confirmMessage'),
          confirmLabel: tr('rh.employe.transitions.solde.confirmLabel'),
        },
      },
      {
        from: 'SUSPENDU', to: 'ACTIF', action: 'reactiver', endpoint: 'reactivate',
        label: tr('rh.employe.transitions.reactiver.label'), icon: 'play-circle', variant: 'primary',
        permission: 'rh.employes.update',
        confirm: {
          title: tr('rh.employe.transitions.reactiver.confirmTitle'),
          message: tr('rh.employe.transitions.reactiver.confirmMessage'),
          confirmLabel: tr('rh.employe.transitions.reactiver.confirmLabel'),
        },
      },
      {
        from: 'SUSPENDU', to: 'SOLDE', action: 'solde', endpoint: 'solde',
        label: tr('rh.employe.transitions.solde.label'), icon: 'user-x', variant: 'danger',
        permission: 'rh.employes.update',
        confirm: {
          title: tr('rh.employe.transitions.solde.confirmTitle'),
          message: tr('rh.employe.transitions.solde.confirmMessage'),
          confirmLabel: tr('rh.employe.transitions.solde.confirmLabel'),
        },
      },
    ],
  };
}

export function buildEmployeDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Employe>(
    {
      entityName: tr('rh.employe.titleSingular'),
      icon: 'user',
      permissionPrefix: 'rh.employes',
      fields: buildEmployeFields(t),
      routes: ROUTES,
      statusMachine: buildEmployeStatusMachine(t),
    },
    {
      sections: buildEmployeSections(t),
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        t.instant('rh.employe.toasts.saved', { matricule: (item as Employe).matricule }),
      deleteConfirm: {
        title: tr('rh.employe.deleteConfirm.title'),
        message: (item) => {
          const e = item as Employe;
          return t.instant('rh.employe.deleteConfirm.message', { matricule: e.matricule, nom: e.nom, prenom: e.prenom });
        },
      },
    },
  );
}
