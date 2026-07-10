import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { Inspection, StatutInspection } from '@applications/erp/hse/models';
import { INSPECTION_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

import { buildInspectionFields } from './fields';
import { ROUTES } from './routes';
import { buildInspectionSections } from './sections';

export function buildInspectionStatusMachine(t: TranslateService): StatusMachineConfig<StatutInspection> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      PLANIFIEE: { label: tr(INSPECTION_STATUS_KEYS.PLANIFIEE), variant: 'info' },
      EN_COURS: { label: tr(INSPECTION_STATUS_KEYS.EN_COURS), variant: 'info' },
      TERMINEE: { label: tr(INSPECTION_STATUS_KEYS.TERMINEE), variant: 'success' },
      ANNULEE: { label: tr(INSPECTION_STATUS_KEYS.ANNULEE), variant: 'default' },
    },
    transitions: [
      {
        from: 'PLANIFIEE', to: 'EN_COURS', action: 'demarrer', endpoint: 'start',
        label: tr('hse.inspection.actions.demarrer'), icon: 'play', variant: 'primary',
        permission: 'hse.inspections.update',
        confirm: {
          title: tr('hse.inspection.confirms.demarrer.title'),
          message: tr('hse.inspection.confirms.demarrer.message'),
          confirmLabel: tr('hse.inspection.confirms.demarrer.confirmLabel'),
        },
      },
      {
        from: 'PLANIFIEE', to: 'ANNULEE', action: 'annuler', endpoint: 'cancel',
        label: tr('hse.inspection.actions.annuler'), icon: 'x-circle', variant: 'danger',
        permission: 'hse.inspections.update',
        confirm: {
          title: tr('hse.inspection.confirms.annulerPlanifiee.title'),
          message: tr('hse.inspection.confirms.annulerPlanifiee.message'),
          confirmLabel: tr('hse.inspection.confirms.annulerPlanifiee.confirmLabel'),
        },
      },
      {
        from: 'EN_COURS', to: 'TERMINEE', action: 'terminer', endpoint: 'complete',
        label: tr('hse.inspection.actions.terminer'), icon: 'check-circle', variant: 'primary',
        permission: 'hse.inspections.update',
        confirm: {
          title: tr('hse.inspection.confirms.terminer.title'),
          message: tr('hse.inspection.confirms.terminer.message'),
          confirmLabel: tr('hse.inspection.confirms.terminer.confirmLabel'),
        },
      },
      {
        from: 'EN_COURS', to: 'ANNULEE', action: 'annuler', endpoint: 'cancel',
        label: tr('hse.inspection.actions.annuler'), icon: 'x-circle', variant: 'danger',
        permission: 'hse.inspections.update',
        confirm: {
          title: tr('hse.inspection.confirms.annulerPlanifiee.title'),
          message: tr('hse.inspection.confirms.annulerPlanifiee.message'),
          confirmLabel: tr('hse.inspection.confirms.annulerPlanifiee.confirmLabel'),
        },
      },
    ],
  };
}

export function buildInspectionDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Inspection>(
    {
      entityName: tr('hse.inspection.entityName'),
      icon: 'clipboard-check',
      permissionPrefix: 'hse.inspections',
      fields: buildInspectionFields(t),
      routes: ROUTES,
      statusMachine: buildInspectionStatusMachine(t),
    },
    {
      sections: buildInspectionSections(t),
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        tr('hse.inspection.toasts.saved').replace('{numero}', (item as Inspection).numero ?? ''),
      deleteConfirm: {
        title: tr('hse.inspection.deleteConfirm.title'),
        message: (item) =>
          tr('hse.inspection.deleteConfirm.message').replace('{numero}', (item as Inspection).numero ?? ''),
      },
    },
  );
}
