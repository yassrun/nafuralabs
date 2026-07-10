import { buildListingConfig } from '@lib/anatomy';
import type { BonCommandeClient } from '@applications/erp/ventes/models';

import { COLUMNS } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export const BCC_LISTING_CONFIG = buildListingConfig<BonCommandeClient>(
  {
    entityName: 'Bon de commande client',
    entityNamePlural: 'Bons de commande clients',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'ventes.bcc',
  },
  {
    filters: FILTERS,
    defaultSort: { column: 'dateReception', direction: 'desc' },
    features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
    emptyState: {
      icon: 'shopping-bag',
      title: 'Aucun bon de commande client',
      message: 'Les bons de commande clients enregistrent les commandes reçues et suivent leur facturation.',
      actionLabel: 'Nouveau BCC',
      actionId: 'create',
    },
  },
);
