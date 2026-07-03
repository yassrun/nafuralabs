import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Employe } from '@applications/erp/rh/models';

import { buildEmployeColumns } from './columns';
import { buildEmployeFilters } from './filters';
import { ROUTES } from './routes';

export function buildEmployesListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<Employe>(
    {
      entityName: tr('rh.employe.titleSingular'),
      entityNamePlural: tr('rh.employe.title'),
      columns: buildEmployeColumns(t),
      routes: ROUTES,
      permissionPrefix: 'rh.employes',
    },
    {
      filters: buildEmployeFilters(t),
      defaultSort: { column: 'nom', direction: 'asc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'user',
        title: tr('rh.employe.listing.emptyState.title'),
        message: tr('rh.employe.listing.emptyState.message'),
        actionLabel: tr('rh.employe.listing.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
