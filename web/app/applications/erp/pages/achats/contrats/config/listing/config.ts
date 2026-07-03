import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { ContratAchat } from '@applications/erp/achats/models';

import { buildContratColumns } from './columns';
import { buildContratFilters } from './filters';
import { ROUTES } from './routes';

export function buildContratsListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<ContratAchat>(
    {
      entityName: tr('achats.contrat.entityName'),
      entityNamePlural: tr('achats.contrat.entityNamePlural'),
      columns: buildContratColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.contrat',
    },
    {
      filters: buildContratFilters(t),
      defaultSort: { column: 'dateDebut', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'file-check',
        title: tr('achats.contrat.list.emptyState.title'),
        message: tr('achats.contrat.list.emptyState.message'),
        actionLabel: tr('achats.contrat.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
