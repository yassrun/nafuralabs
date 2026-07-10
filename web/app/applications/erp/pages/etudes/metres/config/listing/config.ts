import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Metre } from '@applications/erp/etudes/models';

import { buildMetreColumns } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export function buildMetreListingConfig(t: TranslateService) {
  return buildListingConfig<Metre>(
    {
      entityName: 'Métré',
      entityNamePlural: 'Métrés',
      columns: buildMetreColumns(t),
      routes: ROUTES,
      permissionPrefix: 'etudes.metre',
    },
    {
      filters: FILTERS,
      defaultSort: { column: 'dateMetre', direction: 'desc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'ruler',
        title: 'Aucun métré',
        message: "Créez un nouveau métré pour démarrer la quantification d'un projet.",
        actionLabel: 'Nouveau métré',
        actionId: 'create',
      },
    },
  );
}
