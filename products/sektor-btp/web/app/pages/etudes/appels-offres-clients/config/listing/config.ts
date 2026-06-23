import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { AppelOffreClient } from '@applications/erp/etudes/models';

import { buildAocColumns } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export function buildAocListingConfig(t: TranslateService) {
  return buildListingConfig<AppelOffreClient>(
    {
      entityName: "Appel d'offres",
      entityNamePlural: "Appels d'offres clients",
      columns: buildAocColumns(t),
      routes: ROUTES,
      permissionPrefix: 'etudes.aoc',
    },
    {
      filters: FILTERS,
      defaultSort: { column: 'dateLimiteDepot', direction: 'asc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'gavel',
        title: "Aucun appel d'offres",
        message: 'Suivez vos AO publics et privés depuis cette section.',
        actionLabel: 'Nouveau AO',
        actionId: 'create',
      },
    },
  );
}
