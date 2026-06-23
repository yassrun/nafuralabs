import { buildDetailConfig } from '@lib/anatomy';
import type { StatusMachineConfig } from '@lib/anatomy/types';
import type { AppelOffreClient, AOClientStatus } from '@applications/erp/etudes/models';

import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const AOC_STATUS_MACHINE: StatusMachineConfig<AOClientStatus> = {
  field: 'status',
  statuses: {
    A_ETUDIER: { label: 'À étudier', variant: 'default' },
    EN_PREPARATION: { label: 'En préparation', variant: 'warning' },
    SOUMIS: { label: 'Soumis', variant: 'info' },
    ATTRIBUE: { label: 'Attribué', variant: 'success' },
    PERDU: { label: 'Perdu', variant: 'danger' },
    INFRUCTUEUX: { label: 'Infructueux', variant: 'default' },
    ANNULE: { label: 'Annulé', variant: 'default' },
  },
  transitions: [
    {
      from: 'A_ETUDIER',
      to: 'EN_PREPARATION',
      action: 'prepare',
      endpoint: 'prepare',
      label: 'Lancer la préparation',
      icon: 'play',
      variant: 'primary',
      permission: 'etudes.aoc.update',
    },
    {
      from: 'EN_PREPARATION',
      to: 'SOUMIS',
      action: 'submit',
      endpoint: 'submit',
      label: 'Marquer soumis',
      icon: 'send',
      variant: 'primary',
      permission: 'etudes.aoc.submit',
      confirm: {
        title: "Confirmer le dépôt de l'AO ?",
        message: 'Cela enregistre la date de soumission et bloque les modifications.',
        confirmLabel: 'Confirmer dépôt',
      },
    },
    {
      from: 'SOUMIS',
      to: 'ATTRIBUE',
      action: 'win',
      endpoint: 'win',
      label: 'Marquer attribué',
      icon: 'award',
      variant: 'primary',
      permission: 'etudes.aoc.update',
      confirm: {
        title: "Marquer l'AO comme attribué ?",
        message: 'Vous pourrez ensuite générer le chantier.',
        confirmLabel: 'Confirmer attribution',
      },
    },
    {
      from: 'SOUMIS',
      to: 'PERDU',
      action: 'lose',
      endpoint: 'lose',
      label: 'Marquer perdu',
      icon: 'x-circle',
      variant: 'danger',
      permission: 'etudes.aoc.update',
      confirm: {
        title: "Marquer l'AO comme perdu ?",
        message: "Indiquez l'attributaire et le montant gagnant si possible.",
        confirmLabel: 'Confirmer perte',
      },
    },
    {
      from: 'SOUMIS',
      to: 'INFRUCTUEUX',
      action: 'infruct',
      endpoint: 'infruct',
      label: 'Infructueux',
      icon: 'minus-circle',
      variant: 'secondary',
      permission: 'etudes.aoc.update',
    },
    {
      from: ['A_ETUDIER', 'EN_PREPARATION'],
      to: 'ANNULE',
      action: 'cancel',
      endpoint: 'cancel',
      label: 'Annuler',
      icon: 'x',
      variant: 'secondary',
      permission: 'etudes.aoc.cancel',
      confirm: {
        title: "Annuler l'AO ?",
        message: "L'AO ne sera plus suivi.",
        confirmLabel: 'Annuler',
      },
    },
  ],
};

export const AOC_DETAIL_CONFIG = buildDetailConfig<AppelOffreClient>(
  {
    entityName: "Appel d'offres",
    icon: 'gavel',
    permissionPrefix: 'etudes.aoc',
    fields: FIELDS,
    routes: ROUTES,
    statusMachine: AOC_STATUS_MACHINE,
  },
  {
    sections: SECTIONS,
    statusMachineInActionsBar: true,
    statusMachinePosition: 'right',
    actions: {
      appendActions: [
        {
          id: 'convert_chantier',
          label: 'Convertir en chantier',
          icon: 'hard-hat',
          scope: 'view',
          variant: 'primary',
          position: 'right',
          order: 90,
          showInModes: ['view'],
          permission: 'chantiers.chantier.create',
          visible: (ctx) =>
            (ctx.item as AppelOffreClient | undefined)?.status === 'ATTRIBUE',
        },
      ],
    },
    saveSuccessMessage: (item) => `AO ${(item as AppelOffreClient).numero} enregistré`,
    deleteConfirm: {
      title: "Supprimer l'AO",
      message: (item) =>
        `Voulez-vous vraiment supprimer l'AO ${(item as AppelOffreClient).numero} ?`,
    },
  },
);
