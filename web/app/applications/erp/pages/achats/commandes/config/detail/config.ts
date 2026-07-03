import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { BCStatus, BonCommande } from '@applications/erp/achats/models';
import { BC_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildBcFields } from './fields';
import { ROUTES } from './routes';
import { buildBcSections } from './sections';

export function buildBcStatusMachine(t: TranslateService): StatusMachineConfig<BCStatus> {
  const tr = (k: string) => t.instant(k);
  return {
    field: 'status',
    statuses: {
      BROUILLON: { label: tr(BC_STATUS_KEYS.BROUILLON), variant: 'default' },
      VALIDE: { label: tr(BC_STATUS_KEYS.VALIDE), variant: 'info' },
      ENVOYE: { label: tr(BC_STATUS_KEYS.ENVOYE), variant: 'info' },
      ACCUSE_RECEPTION: { label: tr(BC_STATUS_KEYS.ACCUSE_RECEPTION), variant: 'info' },
      PARTIELLEMENT_LIVRE: { label: tr(BC_STATUS_KEYS.PARTIELLEMENT_LIVRE), variant: 'warning' },
      LIVRE: { label: tr(BC_STATUS_KEYS.LIVRE), variant: 'success' },
      FACTURE: { label: tr(BC_STATUS_KEYS.FACTURE), variant: 'success' },
      CLOTURE: { label: tr(BC_STATUS_KEYS.CLOTURE), variant: 'default' },
      ANNULE: { label: tr(BC_STATUS_KEYS.ANNULE), variant: 'danger' },
    },
    transitions: [
      {
        from: 'BROUILLON', to: 'VALIDE', action: 'valider', endpoint: 'validate',
        label: tr('achats.commande.actions.valider'), icon: 'check-circle', variant: 'primary',
        permission: 'achats.commande.valider',
        confirm: {
          title: tr('achats.commande.confirms.valider.title'),
          message: tr('achats.commande.confirms.valider.message'),
          confirmLabel: tr('achats.commande.confirms.valider.confirmLabel'),
        },
      },
      {
        from: 'VALIDE', to: 'ENVOYE', action: 'envoyer', endpoint: 'send',
        label: tr('achats.commande.actions.envoyer'), icon: 'send', variant: 'primary',
        permission: 'achats.commande.update',
      },
      {
        from: 'ENVOYE', to: 'ACCUSE_RECEPTION', action: 'accuser_reception', endpoint: 'acknowledge',
        label: tr('achats.commande.actions.accuserReception'), icon: 'check', variant: 'stroked',
        permission: 'achats.commande.update',
      },
      {
        from: 'LIVRE', to: 'CLOTURE', action: 'cloturer', endpoint: 'close',
        label: tr('achats.commande.actions.cloturer'), icon: 'archive', variant: 'stroked',
        permission: 'achats.commande.update',
        confirm: {
          title: tr('achats.commande.confirms.cloturer.title'),
          message: tr('achats.commande.confirms.cloturer.message'),
          confirmLabel: tr('achats.commande.confirms.cloturer.confirmLabel'),
        },
      },
      {
        from: 'BROUILLON', to: 'ANNULE', action: 'annuler', endpoint: 'cancel',
        label: tr('achats.commande.actions.annuler'), icon: 'x', variant: 'danger',
        permission: 'achats.commande.update',
        confirm: {
          title: tr('achats.commande.confirms.annuler.title'),
          message: tr('achats.commande.confirms.annuler.message'),
          confirmLabel: tr('achats.commande.confirms.annuler.confirmLabel'),
          requireNote: true,
          notePlaceholder: tr('achats.commande.confirms.annuler.notePlaceholder'),
        },
      },
    ],
  };
}

export function buildBcDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<BonCommande>(
    {
      entityName: tr('achats.commande.entityName'),
      icon: 'file-text',
      permissionPrefix: 'achats.commande',
      fields: buildBcFields(t),
      routes: ROUTES,
      statusMachine: buildBcStatusMachine(t),
    },
    {
      sections: buildBcSections(t),
      statusMachineInActionsBar: true,
      actions: {
        appendActions: [
          { id: 'imprimer_bc', label: tr('achats.commande.actions.imprimer'), icon: 'printer', scope: 'edit+view', variant: 'stroked', position: 'left', order: 50, showInModes: ['edit', 'view'] },
          {
            id: 'receptionner',
            label: 'Enregistrer réception',
            icon: 'package',
            scope: 'edit+view',
            variant: 'primary',
            position: 'right',
            order: 5,
            showInModes: ['edit', 'view'],
            visible: (ctx) => {
              const bc = ctx.item as BonCommande | undefined;
              return !!bc && ['ENVOYE', 'ACCUSE_RECEPTION', 'PARTIELLEMENT_LIVRE'].includes(bc.status);
            },
          },
        ],
      },
      saveSuccessMessage: (item) =>
        tr('achats.commande.toasts.saved').replace('{numero}', (item as BonCommande).numero ?? ''),
      deleteConfirm: {
        title: tr('achats.commande.deleteConfirm.title'),
        message: (item) =>
          tr('achats.commande.deleteConfirm.message').replace('{numero}', (item as BonCommande).numero ?? ''),
      },
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.BC, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
