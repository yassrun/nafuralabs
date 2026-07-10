import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { BonCommande } from '@applications/erp/achats/models';

import { buildBcColumns } from './columns';
import { buildBcFilters } from './filters';
import { ROUTES } from './routes';

export function buildBcListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<BonCommande>(
    {
      entityName: tr('achats.commande.entityName'),
      entityNamePlural: tr('achats.commande.entityNamePlural'),
      columns: buildBcColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.commande',
    },
    {
      filters: buildBcFilters(t),
      defaultSort: { column: 'dateCreation', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'file-text',
        title: tr('achats.commande.list.emptyState.title'),
        message: tr('achats.commande.list.emptyState.message'),
        actionLabel: tr('achats.commande.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
