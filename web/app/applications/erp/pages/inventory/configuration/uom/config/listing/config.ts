import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { UomListItem } from '../../models';

import { buildUomColumns } from './columns';
import { ROUTES } from './routes';
import { buildUomFilters } from './filters';

export function buildUomListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<UomListItem>(
    {
      entityName: tr('inventory.configuration.uom.entityName'),
      entityNamePlural: tr('inventory.configuration.uom.entityNamePlural'),
      columns: buildUomColumns(t),
      routes: ROUTES,
      permissionPrefix: 'inventory.uom',
    },
    {
      filters: buildUomFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      features: {},
      emptyState: {
        icon: 'ruler',
      },
    }
  );
}
