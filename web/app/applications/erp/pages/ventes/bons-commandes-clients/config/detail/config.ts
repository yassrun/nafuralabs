import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { BonCommandeClient, BCClientStatus } from '@applications/erp/ventes/models';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const BCC_STATUS_MACHINE: StatusMachineConfig<BCClientStatus> = {
  field: 'status',
  statuses: {
    RECU: { label: 'Reçu', variant: 'info' },
    EN_COURS: { label: 'En cours', variant: 'info' },
    PARTIELLEMENT_FACTURE: { label: 'Part. facturé', variant: 'warning' },
    FACTURE: { label: 'Facturé', variant: 'success' },
    CLOTURE: { label: 'Clôturé', variant: 'default' },
    ANNULE: { label: 'Annulé', variant: 'danger' },
  },
  transitions: [
    {
      from: 'RECU', to: 'EN_COURS', action: 'demarrer', endpoint: 'start',
      label: 'Démarrer', icon: 'play', variant: 'primary',
      permission: 'ventes.bcc.update',
      confirm: { title: 'Démarrer le bon de commande ?', message: 'Le BCC passera en statut En cours.', confirmLabel: 'Démarrer' },
    },
    {
      from: 'RECU', to: 'ANNULE', action: 'annuler', endpoint: 'cancel',
      label: 'Annuler', icon: 'x', variant: 'secondary',
      permission: 'ventes.bcc.update',
      confirm: { title: 'Annuler le bon de commande ?', message: 'Cette action est irréversible.', confirmLabel: 'Annuler' },
    },
    {
      from: 'EN_COURS', to: 'CLOTURE', action: 'cloturer', endpoint: 'close',
      label: 'Clôturer', icon: 'check-square', variant: 'primary',
      permission: 'ventes.bcc.update',
      confirm: { title: 'Clôturer le bon de commande ?', message: 'Le BCC sera marqué clôturé.', confirmLabel: 'Clôturer' },
    },
    {
      from: 'EN_COURS', to: 'ANNULE', action: 'annuler', endpoint: 'cancel',
      label: 'Annuler', icon: 'x', variant: 'secondary',
      permission: 'ventes.bcc.update',
      confirm: { title: 'Annuler le bon de commande ?', message: 'Cette action est irréversible.', confirmLabel: 'Annuler' },
    },
    {
      from: 'PARTIELLEMENT_FACTURE', to: 'CLOTURE', action: 'cloturer', endpoint: 'close',
      label: 'Clôturer', icon: 'check-square', variant: 'primary',
      permission: 'ventes.bcc.update',
      confirm: { title: 'Clôturer le bon de commande ?', message: 'Le BCC sera clôturé malgré une facturation partielle.', confirmLabel: 'Clôturer' },
    },
    {
      from: 'FACTURE', to: 'CLOTURE', action: 'cloturer', endpoint: 'close',
      label: 'Clôturer', icon: 'check-square', variant: 'primary',
      permission: 'ventes.bcc.update',
      confirm: { title: 'Clôturer le bon de commande ?', message: 'Le BCC sera marqué clôturé.', confirmLabel: 'Clôturer' },
    },
  ],
};

export const BCC_DETAIL_CONFIG = buildDetailConfig<BonCommandeClient>(
  {
    entityName: 'Bon de commande client',
    icon: 'shopping-bag',
    permissionPrefix: 'ventes.bcc',
    fields: FIELDS,
    routes: ROUTES,
    statusMachine: BCC_STATUS_MACHINE,
  },
  {
    sections: SECTIONS,
    statusMachineInActionsBar: true,
    saveSuccessMessage: (item) => `BCC ${(item as BonCommandeClient).numero} enregistré`,
    deleteConfirm: {
      title: 'Supprimer le bon de commande',
      message: (item) => `Supprimer le BCC ${(item as BonCommandeClient).numero} ?`,
    },
    ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.BCC, DOCUMENT_ATTACHMENT_CONFIG),
  },
);
