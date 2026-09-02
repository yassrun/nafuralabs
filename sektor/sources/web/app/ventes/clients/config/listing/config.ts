import { buildListingConfig } from '@platform/lib/anatomy';
import type { ClientVenteListItem } from '../../models';
import { CLIENT_IMPORT_DEFINITION } from '@app/socle/shared/smart-import/handlers/client-import.handler';

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
      refresh: true,
    },
    emptyState: {
      icon: 'users',
      title: 'Aucun client',
      message: 'Ajoutez vos clients pour commencer à facturer.',
      actionLabel: 'Nouveau client',
      actionId: 'create',
    },
    smartImport: {
      entityKey: 'client',
      definition: CLIENT_IMPORT_DEFINITION,
      permission: 'ventes.clients.create',
    },
  },
);
