import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { Situation, SituationStatus } from '@applications/erp/chantiers/models';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@applications/erp/shared/config/attachment-detail.config';

import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const SITUATION_STATUS_MACHINE: StatusMachineConfig<SituationStatus> = {
  field: 'status',
  statuses: {
    BROUILLON: { label: 'Brouillon', variant: 'default' },
    SOUMISE: { label: 'Soumise', variant: 'warning' },
    VALIDEE_MOA: { label: 'Validée MOA', variant: 'info' },
    FACTUREE: { label: 'Facturée', variant: 'info' },
    PAYEE: { label: 'Payée', variant: 'success' },
    REJETEE: { label: 'Rejetée', variant: 'danger' },
  },
  transitions: [
    {
      from: 'BROUILLON',
      to: 'SOUMISE',
      action: 'soumettre',
      endpoint: 'submit',
      label: 'Soumettre au MOA',
      icon: 'send',
      variant: 'primary',
      permission: 'chantiers.situation.update',
      confirm: {
        title: 'Soumettre la situation au MOA ?',
        message:
          'La situation passera en état Soumise. Elle ne pourra plus être éditée librement.',
        confirmLabel: 'Soumettre',
      },
    },
    {
      from: 'SOUMISE',
      to: 'VALIDEE_MOA',
      action: 'valider',
      endpoint: 'validate',
      label: 'Valider MOA',
      icon: 'check-circle',
      variant: 'primary',
      permission: 'chantiers.situation.valider',
      confirm: {
        title: 'Valider la situation ?',
        message: (item) =>
          `La situation ${(item as Situation).numero} sera marquée Validée MOA. Cette action est irréversible.`,
        confirmLabel: 'Valider',
      },
    },
    {
      from: 'SOUMISE',
      to: 'REJETEE',
      action: 'rejeter',
      endpoint: 'reject',
      label: 'Rejeter',
      icon: 'x-circle',
      variant: 'danger',
      permission: 'chantiers.situation.rejeter',
      confirm: {
        title: 'Rejeter la situation ?',
        message:
          'La situation sera marquée Rejetée. Indiquez le motif de rejet.',
        confirmLabel: 'Rejeter',
        requireNote: true,
        notePlaceholder: 'Motif du rejet (obligatoire)',
      },
    },
    {
      from: 'VALIDEE_MOA',
      to: 'FACTUREE',
      action: 'emettre_facture',
      endpoint: 'invoice',
      label: 'Émettre la facture',
      icon: 'file-text',
      variant: 'primary',
      permission: 'chantiers.situation.update',
      confirm: {
        title: 'Émettre la facture client ?',
        message: (item) => {
          const s = item as Situation;
          return `Une facture client BROUILLON sera créée pour ${s.netAPayerTtc.toLocaleString(undefined, { maximumFractionDigits: 2 })} MAD TTC.`;
        },
        confirmLabel: 'Émettre',
      },
    },
    {
      from: 'FACTUREE',
      to: 'PAYEE',
      action: 'marquer_payee',
      endpoint: 'pay',
      label: 'Marquer payée',
      icon: 'check',
      variant: 'primary',
      permission: 'chantiers.situation.update',
      confirm: {
        title: 'Marquer la situation payée ?',
        message: 'Cette action sera reflétée dans le tableau de paiements.',
        confirmLabel: 'Confirmer',
      },
    },
  ],
};

export const SITUATION_DETAIL_CONFIG = buildDetailConfig<Situation>(
  {
    entityName: 'Situation',
    icon: 'file-text',
    permissionPrefix: 'chantiers.situation',
    fields: FIELDS,
    routes: ROUTES,
    statusMachine: SITUATION_STATUS_MACHINE,
  },
  {
    sections: SECTIONS,
    statusMachineInActionsBar: true,
    statusMachinePosition: 'right',
    actions: {
      appendActions: [
        {
          id: 'imprimer_decompte',
          label: 'Imprimer décompte',
          icon: 'printer',
          scope: 'view',
          variant: 'stroked',
          position: 'left',
          order: 50,
          showInModes: ['view', 'edit'],
        },
        {
          id: 'reprendre_avancements',
          label: 'Reprendre depuis avancements',
          icon: 'refresh-cw',
          scope: 'view',
          variant: 'stroked',
          position: 'left',
          order: 55,
          showInModes: ['edit', 'create'],
          visible: (ctx) =>
            (ctx.item as Situation | undefined)?.status === 'BROUILLON' ||
            ctx.mode === 'create',
        },
      ],
    },
    saveSuccessMessage: (item) =>
      `Situation ${(item as Situation).numero} enregistrée`,
    deleteConfirm: {
      title: 'Supprimer la situation',
      message: (item) =>
        `Voulez-vous vraiment supprimer la situation ${(item as Situation).numero} ?`,
    },
    ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.SIT, DOCUMENT_ATTACHMENT_CONFIG),
  },
);
