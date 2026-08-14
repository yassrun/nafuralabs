import { buildDetailConfig } from '@platform/lib/anatomy';
import type { StatusMachineConfig } from '@platform/lib/anatomy/types';
import type { Devis, DevisStatus } from '@app/etudes/models';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
  withAttachments,
} from '@app/socle/shared/config/attachment-detail.config';

import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const DEVIS_STATUS_MACHINE: StatusMachineConfig<DevisStatus> = {
  field: 'status',
  statuses: {
    BROUILLON: { label: 'Brouillon', variant: 'default' },
    EMIS: { label: 'Émis', variant: 'info' },
    NEGOCIATION: { label: 'En négociation', variant: 'warning' },
    APPROUVE: { label: 'Approuvé', variant: 'success' },
    PERDU: { label: 'Perdu', variant: 'danger' },
    ANNULE: { label: 'Annulé', variant: 'default' },
    EXPIRE: { label: 'Expiré', variant: 'warning' },
  },
  transitions: [
    {
      from: 'BROUILLON',
      to: 'EMIS',
      action: 'emit',
      endpoint: 'submit',
      label: 'Émettre',
      icon: 'send',
      variant: 'primary',
      permission: 'etudes.devis.emit',
      confirm: {
        title: 'Émettre le devis ?',
        message: 'Le devis passera en état Émis et sera envoyable au client.',
        confirmLabel: 'Émettre',
      },
    },
    {
      from: 'EMIS',
      to: 'NEGOCIATION',
      action: 'negotiate',
      endpoint: 'negotiate',
      label: 'Marquer en négociation',
      icon: 'message-square',
      variant: 'secondary',
      permission: 'etudes.devis.update',
    },
    {
      from: ['EMIS', 'NEGOCIATION'],
      to: 'APPROUVE',
      action: 'approve',
      endpoint: 'approve',
      label: 'Approuver',
      icon: 'check-circle',
      variant: 'primary',
      permission: 'etudes.devis.approve',
      confirm: {
        title: 'Approuver le devis ?',
        message: 'Le devis sera marqué Approuvé. Vous pourrez ensuite générer le chantier.',
        confirmLabel: 'Approuver',
      },
    },
    {
      from: ['EMIS', 'NEGOCIATION'],
      to: 'PERDU',
      action: 'lose',
      endpoint: 'lose',
      label: 'Marquer perdu',
      icon: 'x-circle',
      variant: 'danger',
      permission: 'etudes.devis.lose',
      confirm: {
        title: 'Marquer le devis perdu ?',
        message: 'Indiquez le motif de perte (concurrent, budget, etc.).',
        confirmLabel: 'Confirmer perte',
        requireNote: true,
        notePlaceholder: 'Motif de perte',
      },
    },
    {
      from: ['BROUILLON', 'EMIS', 'NEGOCIATION'],
      to: 'ANNULE',
      action: 'cancel',
      endpoint: 'cancel',
      label: 'Annuler',
      icon: 'x',
      variant: 'secondary',
      permission: 'etudes.devis.cancel',
      confirm: {
        title: 'Annuler le devis ?',
        message: 'Le devis sera marqué annulé. Cette action est irréversible.',
        confirmLabel: 'Annuler',
      },
    },
  ],
};

export const DEVIS_DETAIL_CONFIG = buildDetailConfig<Devis>(
  {
    entityName: 'Devis',
    icon: 'file-text',
    permissionPrefix: 'etudes.devis',
    fields: FIELDS,
    routes: ROUTES,
    statusMachine: DEVIS_STATUS_MACHINE,
  },
  {
    sections: SECTIONS,
    statusMachineInActionsBar: true,
    statusMachinePosition: 'right',
    entityTypeForPrint: 'devis',
    features: { print: true },
    actions: {
      overrideActions: {
        delete: {
          visible: (ctx) => (ctx.item as Devis | undefined)?.status === 'BROUILLON',
        },
        duplicate: {
          visible: (ctx) => (ctx.item as Devis | undefined)?.status === 'BROUILLON',
        },
        save: {
          visible: (ctx) =>
            ctx.mode === 'create' || (ctx.item as Devis | undefined)?.status === 'BROUILLON',
        },
      },
      appendActions: [
        {
          id: 'new_version',
          label: 'Nouvelle version',
          icon: 'copy',
          scope: 'edit+view',
          variant: 'stroked',
          position: 'right',
          order: 70,
          showInModes: ['edit', 'view'],
          permission: 'etudes.devis.update',
          visible: (ctx) => {
            const s = (ctx.item as Devis | undefined)?.status;
            return !!s && s !== 'BROUILLON' && s !== 'ANNULE' && s !== 'PERDU' && s !== 'EXPIRE';
          },
        },
        {
          id: 'convert_chantier',
          label: 'Convertir en chantier',
          icon: 'hard-hat',
          scope: 'edit+view',
          variant: 'primary',
          position: 'right',
          order: 90,
          showInModes: ['edit', 'view'],
          permission: 'chantiers.chantier.create',
          visible: (ctx) => (ctx.item as Devis | undefined)?.status === 'APPROUVE',
        },
      ],
    },
    saveSuccessMessage: (item) =>
      `Devis ${(item as Devis).numero} (V${(item as Devis).version}) enregistré`,
    deleteConfirm: {
      title: 'Supprimer le devis',
      message: (item) => `Voulez-vous vraiment supprimer le devis ${(item as Devis).numero} ?`,
    },
    ...withAttachments(ERP_ATTACHMENT_ENTITY_TYPES.DEVIS, DOCUMENT_ATTACHMENT_CONFIG),
  },
);
