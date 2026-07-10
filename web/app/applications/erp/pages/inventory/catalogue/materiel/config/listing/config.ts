import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { MaterielListItem } from '../../models';

import type { ListingRouteConfig } from '@lib/anatomy/types';

import { buildMaterielColumns } from './columns';
import { ROUTES } from './routes';
import { buildMaterielFilters } from './filters';

export function buildMaterielListingConfig(
  t: TranslateService,
  routes: ListingRouteConfig<MaterielListItem> = ROUTES,
) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<MaterielListItem>(
    {
      entityName: tr('inventory.catalogue.materiel.entityName'),
      entityNamePlural: tr('inventory.catalogue.materiel.entityNamePlural'),
      columns: buildMaterielColumns(t),
      routes,
      permissionPrefix: 'inventory.materiel',
    },
    {
      filters: buildMaterielFilters(t),
      defaultSort: {
        column: 'code',
        direction: 'asc',
      },
      features: {},
      emptyState: {
        icon: 'truck',
      },
    }
  );
}
