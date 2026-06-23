import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Devis } from '@applications/erp/etudes/models';

import { buildDevisColumns } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export function buildDevisListingConfig(t: TranslateService) {
  return buildListingConfig<Devis>(
    {
      entityName: 'Devis',
      entityNamePlural: 'Devis',
      columns: buildDevisColumns(t),
      routes: ROUTES,
      permissionPrefix: 'etudes.devis',
    },
    {
      filters: FILTERS,
      defaultSort: { column: 'dateEmission', direction: 'desc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'file-text',
        title: 'Aucun devis',
        message: 'Créez un nouveau devis pour soumissionner à un client.',
        actionLabel: 'Nouveau devis',
        actionId: 'create',
      },
    },
  );
}
