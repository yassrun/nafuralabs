import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';
import type { Employe } from '@app/rh/models';
import { EMPLOYE_IMPORT_DEFINITION } from '@app/socle/shared/smart-import/handlers/employe-import.handler';

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
      features: { search: true, filters: true, columnToggle: true, refresh: true },
      emptyState: {
        icon: 'user',
        title: tr('rh.employe.listing.emptyState.title'),
        message: tr('rh.employe.listing.emptyState.message'),
        actionLabel: tr('rh.employe.listing.emptyState.actionLabel'),
        actionId: 'create',
      },
      smartImport: {
        entityKey: 'employe',
        definition: EMPLOYE_IMPORT_DEFINITION,
        permission: 'rh.employes.create',
      },
    },
  );
}
