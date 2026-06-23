import { buildDetailConfig } from '@lib/anatomy';
import type { Metre } from '@applications/erp/etudes/models';

import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const METRE_DETAIL_CONFIG = buildDetailConfig<Metre>(
  {
    entityName: 'Métré',
    icon: 'ruler',
    permissionPrefix: 'etudes.metre',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    actions: {
      appendActions: [
        {
          id: 'open_dpgf',
          label: 'DPGF',
          icon: 'account_tree',
          scope: 'view',
          variant: 'secondary',
          position: 'right',
          order: 70,
          showInModes: ['edit', 'view'],
          permission: 'etudes.metre.read',
        },
        {
          id: 'generate_devis',
          label: 'Générer devis',
          icon: 'file-plus',
          scope: 'view',
          variant: 'primary',
          position: 'right',
          order: 80,
          showInModes: ['edit', 'view'],
          permission: 'etudes.devis.create',
        },
      ],
    },
    saveSuccessMessage: (item) => `Métré ${(item as Metre).numero} enregistré`,
    deleteConfirm: {
      title: 'Supprimer le métré',
      message: (item) =>
        `Voulez-vous vraiment supprimer le métré ${(item as Metre).numero} ?`,
    },
  },
);
