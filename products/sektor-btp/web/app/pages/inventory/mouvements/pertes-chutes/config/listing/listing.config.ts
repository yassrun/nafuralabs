import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { FilterFieldConfig } from '@lib/anatomy/types';

import type { PerteListItem } from '../../services/perte.facade';

import { buildPerteColumns } from './columns.config';
import { PERTE_LISTING_ROUTES } from './routes.config';

function buildPerteFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'chantierContains',
      label: tr('inventory.mouvement.perte.list.filters.chantierContains'),
      type: 'text',
      placeholder: tr('inventory.mouvement.perte.list.filters.chantierPlaceholder'),
    },
    {
      key: 'status',
      label: tr('inventory.mouvement.perte.list.filters.status'),
      type: 'select',
      options: [
        { label: tr('inventory.mouvement.perte.list.filters.all'), value: '' },
        { label: tr('inventory.mouvement.perte.status.BROUILLON'), value: 'BROUILLON' },
        { label: tr('inventory.mouvement.perte.status.VALIDE'), value: 'VALIDE' },
      ],
    },
    {
      key: 'motifId',
      label: tr('inventory.mouvement.perte.list.filters.motifId'),
      type: 'select',
      lookupKey: 'motifsPerte',
    },
    {
      key: 'dateFrom',
      label: tr('inventory.mouvement.perte.list.filters.dateFrom'),
      type: 'date',
    },
    {
      key: 'dateTo',
      label: tr('inventory.mouvement.perte.list.filters.dateTo'),
      type: 'date',
    },
  ];
}

export function buildPerteListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<PerteListItem>(
    {
      entityName: tr('inventory.mouvement.perte.entityName'),
      entityNamePlural: tr('inventory.mouvement.perte.entityNamePlural'),
      columns: buildPerteColumns(t),
      routes: PERTE_LISTING_ROUTES,
      permissionPrefix: 'stock.perte',
    },
    {
      filters: buildPerteFilters(t),
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
        icon: 'alert-triangle',
        title: tr('inventory.mouvement.perte.list.emptyState.title'),
        message: tr('inventory.mouvement.perte.list.emptyState.message'),
        actionLabel: tr('inventory.mouvement.perte.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
