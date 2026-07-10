import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Devise } from '@applications/erp/finance/models';

import { buildDeviseColumns } from './columns';
import { buildDeviseFilters } from './filters';
import { ROUTES } from './routes';

export function buildDeviseListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<Devise>(
    {
      entityName: tr('finance.devise.entityName'),
      entityNamePlural: tr('finance.devise.entityNamePlural'),
      columns: buildDeviseColumns(t),
      routes: ROUTES,
      permissionPrefix: 'finance.config.devise',
    },
    {
      filters: buildDeviseFilters(t),
      defaultSort: { column: 'code', direction: 'asc' },
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
        icon: 'circle-dollar-sign',
        title: tr('finance.devise.emptyTitle'),
        message: tr('finance.devise.emptyMessage'),
        actionLabel: tr('finance.devise.actionNew'),
        actionId: 'create',
      },
    },
  );
}
