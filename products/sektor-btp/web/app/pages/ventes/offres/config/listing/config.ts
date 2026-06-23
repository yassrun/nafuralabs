import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { OffreCommerciale } from '@applications/erp/ventes/models';

import { buildOffreColumns } from './columns';
import { buildOffreFilters } from './filters';
import { ROUTES } from './routes';

export function buildOffreListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<OffreCommerciale>(
    {
      entityName: tr('ventes.offre.entityName'),
      entityNamePlural: tr('ventes.offre.entityNamePlural'),
      columns: buildOffreColumns(t),
      routes: ROUTES,
      permissionPrefix: 'ventes.offres',
    },
    {
      filters: buildOffreFilters(t),
      defaultSort: { column: 'dateEmission', direction: 'desc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        refresh: true,
      },
      emptyState: {
        icon: 'file-text',
        title: tr('ventes.offre.list.emptyState.title'),
        message: tr('ventes.offre.list.emptyState.message'),
        actionLabel: tr('ventes.offre.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
