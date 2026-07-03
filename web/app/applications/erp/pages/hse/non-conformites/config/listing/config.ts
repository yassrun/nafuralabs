import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { NonConformite } from '@applications/erp/hse/models';

import { buildNcColumns } from './columns';
import { buildNcFilters } from './filters';
import { ROUTES } from './routes';

export function buildNcListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<NonConformite>(
    {
      entityName: tr('hse.nonConformite.entityName'),
      entityNamePlural: tr('hse.nonConformite.entityNamePlural'),
      columns: buildNcColumns(t),
      routes: ROUTES,
      permissionPrefix: 'hse.nc',
    },
    {
      filters: buildNcFilters(t),
      defaultSort: { column: 'date', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'shield-x',
        title: tr('hse.nonConformite.list.emptyState.title'),
        message: tr('hse.nonConformite.list.emptyState.message'),
        actionLabel: tr('hse.nonConformite.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
