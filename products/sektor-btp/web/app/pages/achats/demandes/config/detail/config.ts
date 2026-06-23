import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { DAStatus, DemandeAchat } from '@applications/erp/achats/models';
import { DA_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildDemandeFields } from './fields';
import { ROUTES } from './routes';
import { buildDemandeSections } from './sections';

export function buildDaStatusMachine(t: TranslateService): StatusMachineConfig<DAStatus> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr(DA_STATUS_KEYS.BROUILLON), variant: 'default' },
      SOUMISE: { label: tr(DA_STATUS_KEYS.SOUMISE), variant: 'warning' },
      APPROUVEE: { label: tr(DA_STATUS_KEYS.APPROUVEE), variant: 'success' },
      REJETEE: { label: tr(DA_STATUS_KEYS.REJETEE), variant: 'danger' },
      CONVERTIE: { label: tr(DA_STATUS_KEYS.CONVERTIE), variant: 'info' },
    },
    transitions: [
      {
        from: 'BROUILLON', to: 'SOUMISE', action: 'soumettre', endpoint: 'submit',
        label: tr('achats.demande.actions.soumettre'), icon: 'send', variant: 'primary',
        permission: 'achats.demande.update',
        confirm: {
          title: tr('achats.demande.confirms.soumettre.title'),
          message: tr('achats.demande.confirms.soumettre.message'),
          confirmLabel: tr('achats.demande.confirms.soumettre.confirmLabel'),
        },
      },
      {
        from: 'SOUMISE', to: 'APPROUVEE', action: 'approuver', endpoint: 'approve',
        label: tr('achats.demande.actions.approuver'), icon: 'check-circle', variant: 'primary',
        permission: 'achats.demande.approuver',
        confirm: {
          title: tr('achats.demande.confirms.approuver.title'),
          message: tr('achats.demande.confirms.approuver.message'),
          confirmLabel: tr('achats.demande.confirms.approuver.confirmLabel'),
        },
      },
      {
        from: 'SOUMISE', to: 'REJETEE', action: 'rejeter', endpoint: 'reject',
        label: tr('achats.demande.actions.rejeter'), icon: 'x-circle', variant: 'danger',
        permission: 'achats.demande.approuver',
        confirm: {
          title: tr('achats.demande.confirms.rejeter.title'),
          message: tr('achats.demande.confirms.rejeter.message'),
          confirmLabel: tr('achats.demande.confirms.rejeter.confirmLabel'),
          requireNote: true,
          notePlaceholder: tr('achats.demande.confirms.rejeter.notePlaceholder'),
        },
      },
      {
        from: 'APPROUVEE', to: 'CONVERTIE', action: 'convertir_bc', endpoint: 'convert',
        label: tr('achats.demande.actions.convertirBc'), icon: 'file-plus', variant: 'primary',
        permission: 'achats.demande.update',
      },
    ],
  };
}

export function buildDemandeDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<DemandeAchat>(
    {
      entityName: tr('achats.demande.entityName'),
      icon: 'shopping-cart',
      permissionPrefix: 'achats.demande',
      fields: buildDemandeFields(t),
      routes: ROUTES,
      statusMachine: buildDaStatusMachine(t),
    },
    {
      sections: buildDemandeSections(t),
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        tr('achats.demande.toasts.saved').replace('{numero}', (item as DemandeAchat).numero ?? ''),
      deleteConfirm: {
        title: tr('achats.demande.deleteConfirm.title'),
        message: (item) =>
          tr('achats.demande.deleteConfirm.message').replace('{numero}', (item as DemandeAchat).numero ?? ''),
      },
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.DA, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
