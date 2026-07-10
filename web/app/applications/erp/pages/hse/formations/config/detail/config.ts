import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { Formation, StatutFormation } from '@applications/erp/hse/models';
import { FORMATION_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

import { buildFormationFields } from './fields';
import { ROUTES } from './routes';
import { buildFormationSections } from './sections';

export function buildFormationStatusMachine(t: TranslateService): StatusMachineConfig<StatutFormation> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      PLANIFIEE: { label: tr(FORMATION_STATUS_KEYS.PLANIFIEE), variant: 'info' },
      EN_COURS: { label: tr(FORMATION_STATUS_KEYS.EN_COURS), variant: 'info' },
      TERMINEE: { label: tr(FORMATION_STATUS_KEYS.TERMINEE), variant: 'success' },
      ANNULEE: { label: tr(FORMATION_STATUS_KEYS.ANNULEE), variant: 'default' },
    },
    transitions: [
      {
        from: 'PLANIFIEE', to: 'EN_COURS', action: 'demarrer', endpoint: 'start',
        label: tr('hse.formation.actions.demarrer'), icon: 'play', variant: 'primary',
        permission: 'hse.formations.update',
        confirm: {
          title: tr('hse.formation.confirms.demarrer.title'),
          message: tr('hse.formation.confirms.demarrer.message'),
          confirmLabel: tr('hse.formation.confirms.demarrer.confirmLabel'),
        },
      },
      {
        from: 'PLANIFIEE', to: 'ANNULEE', action: 'annuler', endpoint: 'cancel',
        label: tr('hse.formation.actions.annuler'), icon: 'x-circle', variant: 'danger',
        permission: 'hse.formations.update',
        confirm: {
          title: tr('hse.formation.confirms.annulerPlanifiee.title'),
          message: tr('hse.formation.confirms.annulerPlanifiee.message'),
          confirmLabel: tr('hse.formation.confirms.annulerPlanifiee.confirmLabel'),
        },
      },
      {
        from: 'EN_COURS', to: 'TERMINEE', action: 'terminer', endpoint: 'complete',
        label: tr('hse.formation.actions.terminer'), icon: 'check-circle', variant: 'primary',
        permission: 'hse.formations.update',
        confirm: {
          title: tr('hse.formation.confirms.terminer.title'),
          message: tr('hse.formation.confirms.terminer.message'),
          confirmLabel: tr('hse.formation.confirms.terminer.confirmLabel'),
        },
      },
      {
        from: 'EN_COURS', to: 'ANNULEE', action: 'annuler', endpoint: 'cancel',
        label: tr('hse.formation.actions.annuler'), icon: 'x-circle', variant: 'danger',
        permission: 'hse.formations.update',
        confirm: {
          title: tr('hse.formation.confirms.annulerPlanifiee.title'),
          message: tr('hse.formation.confirms.annulerPlanifiee.message'),
          confirmLabel: tr('hse.formation.confirms.annulerPlanifiee.confirmLabel'),
        },
      },
    ],
  };
}

export function buildFormationDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Formation>(
    {
      entityName: tr('hse.formation.entityName'),
      icon: 'graduation-cap',
      permissionPrefix: 'hse.formations',
      fields: buildFormationFields(t),
      routes: ROUTES,
      statusMachine: buildFormationStatusMachine(t),
    },
    {
      sections: buildFormationSections(t),
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        tr('hse.formation.toasts.saved').replace('{numero}', (item as Formation).numero ?? ''),
      deleteConfirm: {
        title: tr('hse.formation.deleteConfirm.title'),
        message: (item) =>
          tr('hse.formation.deleteConfirm.message').replace('{numero}', (item as Formation).numero ?? ''),
      },
    },
  );
}
