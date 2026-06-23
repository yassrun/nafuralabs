import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { AppelOffre } from '@applications/erp/achats/models';

import { buildAoColumns } from './columns';
import { buildAoFilters } from './filters';
import { ROUTES } from './routes';

export function buildAoListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<AppelOffre>(
    {
      entityName: tr('achats.appelOffre.entityName'),
      entityNamePlural: tr('achats.appelOffre.entityNamePlural'),
      columns: buildAoColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.ao',
    },
    {
      filters: buildAoFilters(t),
      defaultSort: { column: 'createdAt', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'clipboard-list',
        title: tr('achats.appelOffre.list.emptyState.title'),
        message: tr('achats.appelOffre.list.emptyState.message'),
        actionLabel: tr('achats.appelOffre.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
