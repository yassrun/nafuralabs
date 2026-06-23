import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { FilterFieldConfig } from '@lib/anatomy/types';

import type { InventaireListItem } from '../../services/inventaire.facade';

import { buildInventaireColumns } from './columns.config';
import { INVENTAIRE_LISTING_ROUTES } from './routes.config';

function buildInventaireFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'destLocationId',
      label: tr('inventory.mouvement.inventaire.list.filters.destLocationId'),
      type: 'select',
      lookupKey: 'allLocations',
    },
    {
      key: 'status',
      label: tr('inventory.mouvement.inventaire.list.filters.status'),
      type: 'select',
      options: [
        { label: tr('inventory.mouvement.inventaire.list.filters.all'), value: '' },
        { label: tr('inventory.mouvement.inventaire.status.BROUILLON'), value: 'BROUILLON' },
        { label: tr('inventory.mouvement.inventaire.status.VALIDE'), value: 'VALIDE' },
      ],
    },
    {
      key: 'dateFrom',
      label: tr('inventory.mouvement.inventaire.list.filters.dateFrom'),
      type: 'date',
    },
    {
      key: 'dateTo',
      label: tr('inventory.mouvement.inventaire.list.filters.dateTo'),
      type: 'date',
    },
  ];
}

export function buildInventaireListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<InventaireListItem>(
    {
      entityName: tr('inventory.mouvement.inventaire.entityName'),
      entityNamePlural: tr('inventory.mouvement.inventaire.entityNamePlural'),
      columns: buildInventaireColumns(t),
      routes: INVENTAIRE_LISTING_ROUTES,
      permissionPrefix: 'stock.inventaire',
    },
    {
      filters: buildInventaireFilters(t),
      defaultSort: {
        column: 'txDate',
        direction: 'desc',
      },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'inventory_2',
        title: tr('inventory.mouvement.inventaire.list.emptyState.title'),
        message: tr('inventory.mouvement.inventaire.list.emptyState.message'),
        actionLabel: tr('inventory.mouvement.inventaire.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
