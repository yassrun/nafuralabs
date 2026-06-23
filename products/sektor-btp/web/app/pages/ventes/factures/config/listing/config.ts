import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { FactureClient } from '@applications/erp/ventes/models';

import { buildFactureColumns } from './columns';
import { buildFactureFilters } from './filters';
import { ROUTES } from './routes';

export function buildFactureListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<FactureClient>(
    {
      entityName: tr('ventes.facture.entityName'),
      entityNamePlural: tr('ventes.facture.entityNamePlural'),
      columns: buildFactureColumns(t),
      routes: ROUTES,
      permissionPrefix: 'ventes.facture',
    },
    {
      filters: buildFactureFilters(t),
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
        icon: 'file-text',
        title: tr('ventes.facture.list.emptyState.title'),
        message: tr('ventes.facture.list.emptyState.message'),
        actionLabel: tr('ventes.facture.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
