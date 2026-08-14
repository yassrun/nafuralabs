import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { CostingMethodListItem } from '../../models';

import { buildCostingMethodColumns } from './columns';
import { ROUTES } from './routes';
import { buildCostingMethodFilters } from './filters';

export function buildCostingMethodListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<CostingMethodListItem>(
    {
      entityName: tr('inventory.configuration.costingMethod.entityName'),
      entityNamePlural: tr('inventory.configuration.costingMethod.entityNamePlural'),
      columns: buildCostingMethodColumns(t),
      routes: ROUTES,
      permissionPrefix: 'inventory.costingMethod',
    },
    {
      filters: buildCostingMethodFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      features: {},
      emptyState: {
        icon: 'bar-chart',
      },
    }
  );
}
