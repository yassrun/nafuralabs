import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';
import type { FichePaie } from '@app/rh/models';

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
      segments: [
        { id: 'ALL', label: 'rh.paie.listing.chips.all' },
        { id: 'BROUILLON', label: 'rh.paie.listing.chips.brouillon', filters: { status: 'BROUILLON' } },
        { id: 'VALIDEE', label: 'rh.paie.listing.chips.validee', filters: { status: 'VALIDEE' } },
        { id: 'PAYEE', label: 'rh.paie.listing.chips.payee', filters: { status: 'PAYEE' } },
      ],
      defaultSort: { column: 'mois', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, refresh: true },
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
