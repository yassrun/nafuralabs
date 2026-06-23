import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { FamilleArticleListItem } from '../../models';

import { buildFamilleColumns } from './columns';
import { ROUTES } from './routes';
import { buildFamilleFilters } from './filters';

export function buildFamilleListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<FamilleArticleListItem>(
    {
      entityName: tr('inventory.configuration.famille.entityName'),
      entityNamePlural: tr('inventory.configuration.famille.entityNamePlural'),
      columns: buildFamilleColumns(t),
      routes: ROUTES,
      permissionPrefix: 'inventory.famille',
    },
    {
      filters: buildFamilleFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      features: {},
      emptyState: {
        icon: 'folder',
      },
    }
  );
}
