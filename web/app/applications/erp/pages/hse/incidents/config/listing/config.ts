import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Incident } from '@applications/erp/hse/models';

import { buildIncidentColumns } from './columns';
import { buildIncidentFilters } from './filters';
import { ROUTES } from './routes';

export function buildIncidentsListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<Incident>(
    {
      entityName: tr('hse.incident.entityName'),
      entityNamePlural: tr('hse.incident.entityNamePlural'),
      columns: buildIncidentColumns(t),
      routes: ROUTES,
      permissionPrefix: 'hse.incidents',
    },
    {
      filters: buildIncidentFilters(t),
      defaultSort: { column: 'date', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'alert-triangle',
        title: tr('hse.incident.list.emptyState.title'),
        message: tr('hse.incident.list.emptyState.message'),
        actionLabel: tr('hse.incident.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
