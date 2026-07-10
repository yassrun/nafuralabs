import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { DetailActionConfig, StatusMachineConfig } from '@lib/anatomy/types';
import type { Incident, StatutIncident } from '@applications/erp/hse/models';
import { INCIDENT_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildIncidentFields } from './fields';
import { ROUTES } from './routes';
import { buildIncidentSections } from './sections';

function buildCnssDatAction(t: TranslateService): DetailActionConfig<Incident> {
  return {
    id: 'declarerCnssDat',
    label: t.instant('hse.incident.actions.declarerCnssDat'),
    icon: 'file-text',
    scope: 'edit+view',
    position: 'right',
    variant: 'secondary',
    permission: 'hse.incidents.update',
    visible: (ctx) => {
      const i = ctx.item as Incident | null;
      if (!i?.typeIncident) return false;
      const t = i.typeIncident;
      const needs = t === 'MP' || t === 'AT_TRAVAIL' || t === 'AT_TRAJET';
      return needs && !i.cnssReferenceDeclaration;
    },
  };
}

export function buildIncidentStatusMachine(t: TranslateService): StatusMachineConfig<StatutIncident> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      DECLARE: { label: tr(INCIDENT_STATUS_KEYS.DECLARE), variant: 'info' },
      EN_INVESTIGATION: { label: tr(INCIDENT_STATUS_KEYS.EN_INVESTIGATION), variant: 'warning' },
      CLOTURE: { label: tr(INCIDENT_STATUS_KEYS.CLOTURE), variant: 'default' },
    },
    transitions: [
      {
        from: 'DECLARE', to: 'EN_INVESTIGATION', action: 'investiguer', endpoint: 'investigate',
        label: tr('hse.incident.actions.investiguer'), icon: 'search', variant: 'primary',
        permission: 'hse.incidents.update',
        confirm: {
          title: tr('hse.incident.confirms.investiguer.title'),
          message: tr('hse.incident.confirms.investiguer.message'),
          confirmLabel: tr('hse.incident.confirms.investiguer.confirmLabel'),
        },
      },
      {
        from: 'DECLARE', to: 'CLOTURE', action: 'cloturer', endpoint: 'close',
        label: tr('hse.incident.actions.cloturer'), icon: 'check-circle', variant: 'primary',
        permission: 'hse.incidents.update',
        confirm: {
          title: tr('hse.incident.confirms.cloturer.title'),
          message: tr('hse.incident.confirms.cloturer.message'),
          confirmLabel: tr('hse.incident.confirms.cloturer.confirmLabel'),
        },
      },
      {
        from: 'EN_INVESTIGATION', to: 'CLOTURE', action: 'cloturer', endpoint: 'close',
        label: tr('hse.incident.actions.cloturer'), icon: 'check-circle', variant: 'primary',
        permission: 'hse.incidents.update',
        confirm: {
          title: tr('hse.incident.confirms.cloturer.title'),
          message: tr('hse.incident.confirms.cloturer.message'),
          confirmLabel: tr('hse.incident.confirms.cloturer.confirmLabel'),
        },
      },
    ],
  };
}

export function buildIncidentDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Incident>(
    {
      entityName: tr('hse.incident.entityName'),
      icon: 'alert-triangle',
      permissionPrefix: 'hse.incidents',
      fields: buildIncidentFields(t),
      routes: ROUTES,
      statusMachine: buildIncidentStatusMachine(t),
    },
    {
      sections: buildIncidentSections(t),
      statusMachineInActionsBar: true,
      actions: { appendActions: [buildCnssDatAction(t)] },
      saveSuccessMessage: (item) =>
        tr('hse.incident.toasts.saved').replace('{numero}', (item as Incident).numero ?? ''),
      deleteConfirm: {
        title: tr('hse.incident.deleteConfirm.title'),
        message: (item) =>
          tr('hse.incident.deleteConfirm.message').replace('{numero}', (item as Incident).numero ?? ''),
      },
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.INCIDENT, {
        ...DOCUMENT_ATTACHMENT_CONFIG,
        allowedTypes: ['application/pdf', 'image/*'],
      }),
    },
  );
}
