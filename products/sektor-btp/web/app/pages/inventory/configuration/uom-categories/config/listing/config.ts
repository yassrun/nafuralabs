import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { UomCategoryListItem } from '../../models';

import { buildUomCategoryColumns } from './columns';
import { ROUTES } from './routes';
import { buildUomCategoryFilters } from './filters';

export function buildUomCategoryListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<UomCategoryListItem>(
    {
      entityName: tr('inventory.configuration.uomCategory.entityName'),
      entityNamePlural: tr('inventory.configuration.uomCategory.entityNamePlural'),
      columns: buildUomCategoryColumns(t),
      routes: ROUTES,
      permissionPrefix: 'inventory.uomCategory',
    },
    {
      filters: buildUomCategoryFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      features: {},
      emptyState: {
        icon: 'file-text',
      },
    }
  );
}
