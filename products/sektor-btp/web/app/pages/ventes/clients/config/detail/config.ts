import { buildDetailConfig } from '@lib/anatomy';
import type { ClientVente } from '../../models';

import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const CLIENT_DETAIL_CONFIG = buildDetailConfig<ClientVente>(
  {
    entityName: 'Client',
    icon: 'users',
    permissionPrefix: 'ventes.clients',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Client ${(item as ClientVente).nom} enregistré`,
    deleteConfirm: {
      title: 'Supprimer le client',
      message: (item) => `Supprimer ${(item as ClientVente).nom} ?`,
    },
  },
);
