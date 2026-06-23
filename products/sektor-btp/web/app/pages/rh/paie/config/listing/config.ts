import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { FichePaie } from '@applications/erp/rh/models';

import { buildPaieColumns } from './columns';
import { buildPaieFilters } from './filters';
import { ROUTES } from './routes';

export function buildPaieListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<FichePaie>(
    {
      entityName: tr('rh.paie.bulletin.titleSingular'),
      entityNamePlural: tr('rh.paie.bulletin.title'),
      columns: buildPaieColumns(t),
      routes: ROUTES,
      permissionPrefix: 'rh.paie',
    },
    {
      filters: buildPaieFilters(t),
      defaultSort: { column: 'mois', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, selectionMode: 'none', refresh: true },
      emptyState: {
        icon: 'banknote',
        title: tr('rh.paie.listing.emptyState.title'),
        message: tr('rh.paie.listing.emptyState.message'),
        actionLabel: tr('rh.paie.listing.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
