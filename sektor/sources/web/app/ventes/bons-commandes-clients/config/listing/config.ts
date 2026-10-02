import { buildListingConfig } from '@platform/lib/anatomy';
import type { BonCommandeClient } from '@app/ventes/models';

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
    segments: [
      { id: 'ALL', label: 'Tous' },
      { id: 'RECU', label: 'Reçus', filters: { status: 'RECU' } },
      { id: 'EN_COURS', label: 'En cours', filters: { status: 'EN_COURS' } },
      { id: 'PARTIELLEMENT_FACTURE', label: 'Part. facturés', filters: { status: 'PARTIELLEMENT_FACTURE' } },
      { id: 'FACTURE', label: 'Facturés', filters: { status: 'FACTURE' } },
    ],
    defaultSort: { column: 'dateReception', direction: 'desc' },
    features: { search: true, filters: true, columnToggle: true, refresh: true },
    emptyState: {
      icon: 'shopping-bag',
      title: 'Aucun bon de commande client',
      message: 'Les bons de commande clients enregistrent les commandes reçues et suivent leur facturation.',
      actionLabel: 'Nouveau BCC',
      actionId: 'create',
    },
  },
);
