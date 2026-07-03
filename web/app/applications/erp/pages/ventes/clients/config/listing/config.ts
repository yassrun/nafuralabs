import { buildListingConfig } from '@lib/anatomy';
import type { ClientVenteListItem } from '../../models';

import { COLUMNS } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export const CLIENT_LISTING_CONFIG = buildListingConfig<ClientVenteListItem>(
  {
    entityName: 'Client',
    entityNamePlural: 'Clients',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'ventes.clients',
  },
  {
    filters: FILTERS,
    defaultSort: { column: 'nom', direction: 'asc' },
    features: {
      search: true,
      filters: true,
      columnToggle: true,
      selectionMode: 'none',
      refresh: true,
    },
    emptyState: {
      icon: 'users',
      title: 'Aucun client',
      message: 'Ajoutez vos clients pour commencer à facturer.',
      actionLabel: 'Nouveau client',
      actionId: 'create',
    },
  },
);
