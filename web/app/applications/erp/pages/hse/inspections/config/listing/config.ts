import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Inspection } from '@applications/erp/hse/models';

import { buildInspectionColumns } from './columns';
import { buildInspectionFilters } from './filters';
import { ROUTES } from './routes';

export function buildInspectionsListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<Inspection>(
    {
      entityName: tr('hse.inspection.entityName'),
      entityNamePlural: tr('hse.inspection.entityNamePlural'),
      columns: buildInspectionColumns(t),
      routes: ROUTES,
      permissionPrefix: 'hse.inspections',
    },
    {
      filters: buildInspectionFilters(t),
      defaultSort: { column: 'dateInspection', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'clipboard-check',
        title: tr('hse.inspection.list.emptyState.title'),
        message: tr('hse.inspection.list.emptyState.message'),
        actionLabel: tr('hse.inspection.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
