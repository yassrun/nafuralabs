import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Fournisseur } from '@applications/erp/achats/models';

import { buildFournisseurColumns } from './columns';
import { buildFournisseurFilters } from './filters';
import { ROUTES } from './routes';

export function buildFournisseursListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<Fournisseur>(
    {
      entityName: tr('achats.fournisseur.entityName'),
      entityNamePlural: tr('achats.fournisseur.entityNamePlural'),
      columns: buildFournisseurColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.fournisseur',
    },
    {
      filters: buildFournisseurFilters(t),
      defaultSort: { column: 'raisonSociale', direction: 'asc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'truck',
        title: tr('achats.fournisseur.list.emptyState.title'),
        message: tr('achats.fournisseur.list.emptyState.message'),
        actionLabel: tr('achats.fournisseur.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
