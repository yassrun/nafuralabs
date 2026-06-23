import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Ouvrage } from '@applications/erp/etudes/models';

import { buildOuvrageColumns } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export function buildOuvrageListingConfig(t: TranslateService) {
  return buildListingConfig<Ouvrage>(
    {
      entityName: 'Ouvrage',
      entityNamePlural: 'Bibliothèque de prix',
      columns: buildOuvrageColumns(t),
      routes: ROUTES,
      permissionPrefix: 'etudes.ouvrage',
    },
    {
      filters: FILTERS,
      defaultSort: { column: 'code', direction: 'asc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'book-open',
        title: 'Bibliothèque vide',
        message: 'Créez un nouvel ouvrage pour démarrer votre bordereau de prix.',
        actionLabel: 'Nouvel ouvrage',
        actionId: 'create',
      },
    },
  );
}
