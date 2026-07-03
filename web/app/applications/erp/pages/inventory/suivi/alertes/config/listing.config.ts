import { buildListingConfig } from '@lib/anatomy';
import type { EntityActionConfig } from '@lib/anatomy/types';
import type { TranslateService } from '@ngx-translate/core';

import type { AlertListItem } from '../services/alertes-reappro.facade';

import { buildAlertesListingColumns } from './listing.columns';
import { buildAlertesListingFilters } from './listing.filters';
import { ALERTES_LISTING_ROUTES } from './listing.routes';

function buildRowActions(t: TranslateService): EntityActionConfig<AlertListItem>[] {
  return [
    {
      id: 'createReception',
      label: t.instant('inventory.suivi.alertes.actions.createReception'),
      icon: 'plus',
      scope: 'single',
    },
    {
      id: 'editThreshold',
      label: t.instant('inventory.suivi.alertes.actions.editThreshold'),
      icon: 'edit',
      scope: 'single',
    },
  ];
}

export function buildAlertesListingConfig(t: TranslateService) {
  return buildListingConfig<AlertListItem>(
    {
      entityName: t.instant('inventory.suivi.alertes.headerTitle'),
      entityNamePlural: t.instant('inventory.suivi.alertes.headerTitle'),
      columns: buildAlertesListingColumns(t),
      routes: ALERTES_LISTING_ROUTES,
      permissionPrefix: 'stock.alertes-reappro',
    },
    {
      filters: buildAlertesListingFilters(t),
      defaultSort: {
        column: 'shortage',
        direction: 'desc',
      },
      customActions: buildRowActions(t),
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'check-circle',
        title: t.instant('inventory.suivi.alertes.list.emptyTitle'),
        message: t.instant('inventory.suivi.alertes.list.emptyMessage'),
      },
    },
  );
}
