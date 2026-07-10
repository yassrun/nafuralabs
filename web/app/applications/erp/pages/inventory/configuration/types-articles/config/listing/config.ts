import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { TypeArticleListItem } from '../../models';

import { buildTypeArticleColumns } from './columns';
import { ROUTES } from './routes';
import { buildTypeArticleFilters } from './filters';

export function buildTypeArticleListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<TypeArticleListItem>(
    {
      entityName: tr('inventory.configuration.typeArticle.entityName'),
      entityNamePlural: tr('inventory.configuration.typeArticle.entityNamePlural'),
      columns: buildTypeArticleColumns(t),
      routes: ROUTES,
      permissionPrefix: 'inventory.typeArticle',
    },
    {
      filters: buildTypeArticleFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      features: {},
      emptyState: {
        icon: 'tag',
      },
    }
  );
}
