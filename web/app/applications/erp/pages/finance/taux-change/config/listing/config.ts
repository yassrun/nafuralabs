import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { TauxChange } from '@applications/erp/finance/models';

import { buildTauxChangeColumns } from './columns';
import { buildTauxChangeFilters } from './filters';
import { ROUTES } from './routes';

export function buildTauxChangeListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<TauxChange>(
    {
      entityName: tr('finance.tauxChange.entityName'),
      entityNamePlural: tr('finance.tauxChange.entityNamePlural'),
      columns: buildTauxChangeColumns(t),
      routes: ROUTES,
      permissionPrefix: 'finance.config.tauxChange',
    },
    {
      filters: buildTauxChangeFilters(t),
      defaultSort: { column: 'dateValidite', direction: 'desc' },
      features: {
        search: true,
        filters: true,
        columnToggle: false,
        selectionMode: 'none',
        viewModeToggle: false,
        importExport: true,
        refresh: true,
      },
      emptyState: {
        icon: 'trending-up',
        title: tr('finance.tauxChange.list.emptyState.title'),
        message: tr('finance.tauxChange.list.emptyState.message'),
        actionLabel: tr('finance.tauxChange.actions.create'),
        actionId: 'create',
      },
    },
  );
}
