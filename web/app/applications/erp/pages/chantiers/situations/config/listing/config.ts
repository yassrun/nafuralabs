import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Situation } from '@applications/erp/chantiers/models';

import { buildSituationsColumns } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export function buildSituationsListingConfig(t: TranslateService) {
  return buildListingConfig<Situation>(
    {
      entityName: 'Situation',
      entityNamePlural: t.instant('chantiers.situation.title'),
      columns: buildSituationsColumns(t),
      routes: ROUTES,
      permissionPrefix: 'chantiers.situation',
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
        importExport: true,
        refresh: true,
      },
      emptyState: {
        icon: 'description',
        title: 'Aucune situation',
        message:
          'Émettez vos décomptes mensuels par chantier pour suivre les facturations progressives.',
        actionLabel: 'Nouvelle situation',
        actionId: 'create',
      },
    },
  );
}
