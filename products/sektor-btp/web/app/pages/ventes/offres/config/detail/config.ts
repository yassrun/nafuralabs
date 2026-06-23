import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { OffreCommerciale, OffreStatus } from '@applications/erp/ventes/models';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { buildOffreFields } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const OFFRE_STATUS_MACHINE: StatusMachineConfig<OffreStatus> = {
  field: 'status',
  statuses: {
    BROUILLON: { label: 'Brouillon', variant: 'default' },
    ENVOYEE: { label: 'Envoyée', variant: 'info' },
    ACCEPTEE: { label: 'Acceptée', variant: 'success' },
    REFUSEE: { label: 'Refusée', variant: 'danger' },
    EXPIREE: { label: 'Expirée', variant: 'warning' },
    CONVERTIE: { label: 'Convertie', variant: 'success' },
    ANNULEE: { label: 'Annulée', variant: 'default' },
  },
  transitions: [
    {
      from: 'BROUILLON', to: 'ENVOYEE', action: 'envoyer', endpoint: 'send',
      label: 'Envoyer', icon: 'send', variant: 'primary',
      permission: 'ventes.offres.update',
      confirm: { title: 'Envoyer l\'offre ?', message: 'L\'offre sera envoyée au client.', confirmLabel: 'Envoyer' },
    },
    {
      from: 'BROUILLON', to: 'ANNULEE', action: 'annuler', endpoint: 'cancel',
      label: 'Annuler', icon: 'x', variant: 'secondary',
      permission: 'ventes.offres.update',
      confirm: { title: 'Annuler l\'offre ?', message: 'Cette action est irréversible.', confirmLabel: 'Annuler' },
    },
    {
      from: 'ENVOYEE', to: 'ACCEPTEE', action: 'accepter', endpoint: 'accept',
      label: 'Acceptée', icon: 'check-circle', variant: 'primary',
      permission: 'ventes.offres.update',
      confirm: { title: 'Marquer comme acceptée ?', message: 'L\'offre sera marquée comme acceptée par le client.', confirmLabel: 'Confirmer' },
    },
    {
      from: 'ENVOYEE', to: 'REFUSEE', action: 'refuser', endpoint: 'refuse',
      label: 'Refusée', icon: 'x-circle', variant: 'danger',
      permission: 'ventes.offres.update',
      confirm: { title: 'Marquer comme refusée ?', message: 'Précisez le motif de refus.', confirmLabel: 'Confirmer', requireNote: true, notePlaceholder: 'Motif de refus obligatoire' },
    },
    {
      from: 'ENVOYEE', to: 'ANNULEE', action: 'annuler', endpoint: 'cancel',
      label: 'Annuler', icon: 'x', variant: 'secondary',
      permission: 'ventes.offres.update',
      confirm: { title: 'Annuler l\'offre ?', message: 'Cette action est irréversible.', confirmLabel: 'Annuler' },
    },
  ],
};

export function buildOffreDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<OffreCommerciale>(
    {
      entityName: tr('ventes.offre.entityName'),
      icon: 'file-text',
      permissionPrefix: 'ventes.offres',
      fields: buildOffreFields(t),
      routes: ROUTES,
      statusMachine: OFFRE_STATUS_MACHINE,
    },
    {
      sections: SECTIONS,
      statusMachineInActionsBar: true,
      saveSuccessMessage: (item) =>
        tr('ventes.offre.toasts.saved').replace('{numero}', (item as OffreCommerciale).numero ?? ''),
      deleteConfirm: {
        title: tr('ventes.offre.delete.title'),
        message: (item) =>
          tr('ventes.offre.delete.message').replace('{numero}', (item as OffreCommerciale).numero ?? ''),
      },
      customActions: [
        {
          id: 'convert_bcc',
          label: 'Créer BCC',
          icon: 'file-plus',
          scope: 'view',
          variant: 'primary',
          position: 'right',
          order: 5,
          showInModes: ['view'],
          visible: (ctx) => {
            const o = ctx.item as OffreCommerciale | undefined;
            return o?.status === 'ACCEPTEE' && !o.bccId;
          },
        },
        {
          id: 'open_bcc',
          label: 'Voir BCC',
          icon: 'external-link',
          scope: 'view',
          variant: 'secondary',
          position: 'right',
          order: 6,
          showInModes: ['view'],
          visible: (ctx) => !!(ctx.item as OffreCommerciale | undefined)?.bccId,
        },
      ],
      ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.OFFRE, DOCUMENT_ATTACHMENT_CONFIG),
    },
  );
}
