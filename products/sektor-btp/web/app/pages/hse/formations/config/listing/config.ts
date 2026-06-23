import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Formation } from '@applications/erp/hse/models';

import { buildFormationColumns } from './columns';
import { buildFormationFilters } from './filters';
import { ROUTES } from './routes';

export function buildFormationsListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<Formation>(
    {
      entityName: tr('hse.formation.entityName'),
      entityNamePlural: tr('hse.formation.entityNamePlural'),
      columns: buildFormationColumns(t),
      routes: ROUTES,
      permissionPrefix: 'hse.formations',
    },
    {
      filters: buildFormationFilters(t),
      defaultSort: { column: 'dateDebut', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'graduation-cap',
        title: tr('hse.formation.list.emptyState.title'),
        message: tr('hse.formation.list.emptyState.message'),
        actionLabel: tr('hse.formation.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
