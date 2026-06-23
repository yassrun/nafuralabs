import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { LocationConfigListItem } from '../../models';

import { buildDepotColumns } from './columns';
import { ROUTES } from './routes';
import { buildDepotFilters } from './filters';

export function buildDepotListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<LocationConfigListItem>(
    {
      entityName: tr('inventory.configuration.depot.entityName'),
      entityNamePlural: tr('inventory.configuration.depot.entityNamePlural'),
      columns: buildDepotColumns(t),
      routes: ROUTES,
      permissionPrefix: 'inventory.location',
    },
    {
      filters: buildDepotFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      features: {},
      emptyState: {
        icon: 'map-pin',
      },
    }
  );
}
