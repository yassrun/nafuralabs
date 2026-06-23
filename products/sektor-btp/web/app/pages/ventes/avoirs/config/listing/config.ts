import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Avoir } from '@applications/erp/ventes/models';

import { buildAvoirColumns } from './columns';
import { buildAvoirFilters } from './filters';
import { ROUTES } from './routes';

export function buildAvoirListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<Avoir>(
    {
      entityName: tr('ventes.avoir.entityName'),
      entityNamePlural: tr('ventes.avoir.entityNamePlural'),
      columns: buildAvoirColumns(t),
      routes: ROUTES,
      permissionPrefix: 'ventes.avoir',
    },
    {
      filters: buildAvoirFilters(t),
      defaultSort: { column: 'dateEmission', direction: 'desc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        importExport: true,
        refresh: true,
      },
      emptyState: {
        icon: 'corner-down-left',
        title: tr('ventes.avoir.list.emptyState.title'),
        message: tr('ventes.avoir.list.emptyState.message'),
        actionLabel: tr('ventes.avoir.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
