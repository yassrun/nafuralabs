import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Conge } from '@applications/erp/rh/models';

import { buildCongeColumns } from './columns';
import { buildCongeFilters } from './filters';
import { ROUTES } from './routes';

export function buildCongesListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<Conge>(
    {
      entityName: tr('rh.conge.titleSingular'),
      entityNamePlural: tr('rh.conge.title'),
      columns: buildCongeColumns(t),
      routes: ROUTES,
      permissionPrefix: 'rh.conges',
    },
    {
      filters: buildCongeFilters(t),
      defaultSort: { column: 'dateDebut', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'calendar-off',
        title: tr('rh.conge.listing.emptyState.title'),
        message: tr('rh.conge.listing.emptyState.message'),
        actionLabel: tr('rh.conge.listing.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
