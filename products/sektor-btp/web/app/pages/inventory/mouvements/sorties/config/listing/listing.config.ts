import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { FilterFieldConfig } from '@lib/anatomy/types';

import type { SortieListItem } from '../../services/sortie.facade';

import { buildSortieColumns } from './columns.config';
import { SORTIE_LISTING_ROUTES } from './routes.config';

function buildSortieFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'chantierContains',
      label: tr('inventory.mouvement.sortie.list.filters.chantierContains'),
      type: 'text',
      placeholder: tr('inventory.mouvement.sortie.list.filters.chantierPlaceholder'),
    },
    {
      key: 'status',
      label: tr('inventory.mouvement.sortie.list.filters.status'),
      type: 'select',
      options: [
        { label: tr('inventory.mouvement.sortie.list.filters.all'), value: '' },
        { label: tr('inventory.mouvement.sortie.status.BROUILLON'), value: 'BROUILLON' },
        { label: tr('inventory.mouvement.sortie.status.VALIDE'), value: 'VALIDE' },
      ],
    },
    {
      key: 'motifId',
      label: tr('inventory.mouvement.sortie.list.filters.motifId'),
      type: 'select',
      lookupKey: 'motifsSortie',
    },
    {
      key: 'dateFrom',
      label: tr('inventory.mouvement.sortie.list.filters.dateFrom'),
      type: 'date',
    },
    {
      key: 'dateTo',
      label: tr('inventory.mouvement.sortie.list.filters.dateTo'),
      type: 'date',
    },
  ];
}

export function buildSortieListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<SortieListItem>(
    {
      entityName: tr('inventory.mouvement.sortie.entityName'),
      entityNamePlural: tr('inventory.mouvement.sortie.entityNamePlural'),
      columns: buildSortieColumns(t),
      routes: SORTIE_LISTING_ROUTES,
      permissionPrefix: 'stock.sortie',
    },
    {
      filters: buildSortieFilters(t),
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
        importExport: true,
        refresh: true,
      },
      emptyState: {
        icon: 'arrow-up-right',
        title: tr('inventory.mouvement.sortie.list.emptyState.title'),
        message: tr('inventory.mouvement.sortie.list.emptyState.message'),
        actionLabel: tr('inventory.mouvement.sortie.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
