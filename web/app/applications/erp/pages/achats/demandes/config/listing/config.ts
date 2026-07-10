import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { DemandeAchat } from '@applications/erp/achats/models';

import { buildDemandeColumns } from './columns';
import { buildDemandeFilters } from './filters';
import { ROUTES } from './routes';

export function buildDemandesListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<DemandeAchat>(
    {
      entityName: tr('achats.demande.entityName'),
      entityNamePlural: tr('achats.demande.entityNamePlural'),
      columns: buildDemandeColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.demande',
    },
    {
      filters: buildDemandeFilters(t),
      defaultSort: { column: 'createdAt', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'shopping-cart',
        title: tr('achats.demande.list.emptyState.title'),
        message: tr('achats.demande.list.emptyState.message'),
        actionLabel: tr('achats.demande.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
