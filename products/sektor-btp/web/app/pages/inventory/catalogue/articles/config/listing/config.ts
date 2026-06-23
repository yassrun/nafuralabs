import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { ArticleListItem } from '../../models';

import { buildArticleColumns } from './columns';
import { ROUTES } from './routes';
import { buildArticleFilters } from './filters';

export function buildArticleListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<ArticleListItem>(
    {
      entityName: tr('inventory.catalogue.article.entityName'),
      entityNamePlural: tr('inventory.catalogue.article.entityNamePlural'),
      columns: buildArticleColumns(t),
      routes: ROUTES,
      permissionPrefix: 'inventory.article',
    },
    {
      filters: buildArticleFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      features: {},
      emptyState: {
        icon: 'package',
      },
    }
  );
}
