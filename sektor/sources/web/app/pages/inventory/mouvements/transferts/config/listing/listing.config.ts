import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { FilterFieldConfig } from '@lib/anatomy/types';

import type { TransfertListItem } from '../../services/transfert.facade';

import { buildTransfertColumns } from './columns.config';
import { TRANSFERT_LISTING_ROUTES } from './routes.config';

function buildTransfertFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status',
      label: tr('inventory.mouvement.transfert.list.filters.status'),
      type: 'select',
      options: [
        { label: tr('inventory.mouvement.transfert.list.filters.all'), value: '' },
        { label: tr('inventory.mouvement.transfert.status.BROUILLON'), value: 'BROUILLON' },
        { label: tr('inventory.mouvement.transfert.status.VALIDE'), value: 'VALIDE' },
        { label: tr('inventory.mouvement.transfert.status.ANNULE'), value: 'ANNULE' },
      ],
    },
    {
      key: 'sourceLocationId',
      label: tr('inventory.mouvement.transfert.list.filters.sourceLocationId'),
      type: 'select',
      lookupKey: 'allLocations',
    },
    {
      key: 'destLocationId',
      label: tr('inventory.mouvement.transfert.list.filters.destLocationId'),
      type: 'select',
      lookupKey: 'allLocations',
    },
    {
      key: 'dateFrom',
      label: tr('inventory.mouvement.transfert.list.filters.dateFrom'),
      type: 'date',
    },
    {
      key: 'dateTo',
      label: tr('inventory.mouvement.transfert.list.filters.dateTo'),
      type: 'date',
    },
  ];
}

export function buildTransfertListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<TransfertListItem>(
    {
      entityName: tr('inventory.mouvement.transfert.entityName'),
      entityNamePlural: tr('inventory.mouvement.transfert.entityNamePlural'),
      columns: buildTransfertColumns(t),
      routes: TRANSFERT_LISTING_ROUTES,
      permissionPrefix: 'stock.transfert',
    },
    {
      filters: buildTransfertFilters(t),
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
        icon: 'repeat',
        title: tr('inventory.mouvement.transfert.list.emptyState.title'),
        message: tr('inventory.mouvement.transfert.list.emptyState.message'),
        actionLabel: tr('inventory.mouvement.transfert.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
