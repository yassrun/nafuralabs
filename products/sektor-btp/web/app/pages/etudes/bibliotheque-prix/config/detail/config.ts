import { buildDetailConfig } from '@lib/anatomy';
import type { Ouvrage } from '@applications/erp/etudes/models';

import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const OUVRAGE_DETAIL_CONFIG = buildDetailConfig<Ouvrage>(
  {
    entityName: 'Ouvrage',
    icon: 'book-open',
    permissionPrefix: 'etudes.ouvrage',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) =>
      `Ouvrage ${(item as Ouvrage).code} — ${(item as Ouvrage).designation} enregistré`,
    deleteConfirm: {
      title: 'Supprimer l\'ouvrage',
      message: (item) =>
        `Voulez-vous vraiment supprimer l'ouvrage ${(item as Ouvrage).code} ?`,
    },
  },
);
