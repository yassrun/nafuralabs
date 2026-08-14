import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { MotifMouvementListItem } from '../../models';

import { buildMotifColumns } from './columns';
import { ROUTES } from './routes';
import { buildMotifFilters } from './filters';

export function buildMotifListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<MotifMouvementListItem>(
    {
      entityName: tr('inventory.configuration.motif.entityName'),
      entityNamePlural: tr('inventory.configuration.motif.entityNamePlural'),
      columns: buildMotifColumns(t),
      routes: ROUTES,
      permissionPrefix: 'inventory.motif',
    },
    {
      filters: buildMotifFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      emptyState: {
        icon: 'list-ordered',
      },
    }
  );
}
