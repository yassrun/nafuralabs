import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { FilterFieldConfig } from '@lib/anatomy/types';

import type { RetourListItem } from '../../services/retour.facade';

import { buildRetourColumns } from './columns.config';
import { RETOUR_LISTING_ROUTES } from './routes.config';

function buildRetourFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status',
      label: tr('inventory.mouvement.retour.list.filters.status'),
      type: 'select',
      options: [
        { label: tr('inventory.mouvement.retour.list.filters.all'), value: '' },
        { label: tr('inventory.mouvement.retour.status.BROUILLON'), value: 'BROUILLON' },
        { label: tr('inventory.mouvement.retour.status.VALIDE'), value: 'VALIDE' },
        { label: tr('inventory.mouvement.retour.status.ANNULE'), value: 'ANNULE' },
      ],
    },
    {
      key: 'sourceLocationId',
      label: tr('inventory.mouvement.retour.list.filters.sourceLocationId'),
      type: 'select',
      lookupKey: 'chantierLocations',
    },
    {
      key: 'dateFrom',
      label: tr('inventory.mouvement.retour.list.filters.dateFrom'),
      type: 'date',
    },
    {
      key: 'dateTo',
      label: tr('inventory.mouvement.retour.list.filters.dateTo'),
      type: 'date',
    },
  ];
}

export function buildRetourListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<RetourListItem>(
    {
      entityName: tr('inventory.mouvement.retour.entityName'),
      entityNamePlural: tr('inventory.mouvement.retour.entityNamePlural'),
      columns: buildRetourColumns(t),
      routes: RETOUR_LISTING_ROUTES,
      permissionPrefix: 'stock.retour',
    },
    {
      filters: buildRetourFilters(t),
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
        icon: 'rotate-ccw',
        title: tr('inventory.mouvement.retour.list.emptyState.title'),
        message: tr('inventory.mouvement.retour.list.emptyState.message'),
        actionLabel: tr('inventory.mouvement.retour.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
