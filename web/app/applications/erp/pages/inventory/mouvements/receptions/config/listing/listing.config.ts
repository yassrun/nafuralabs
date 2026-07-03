import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';

import { buildReceptionColumns } from './columns.config';
import { RECEPTION_PANEL_ROUTES } from './routes.config';
import { buildReceptionFilters } from './filters';
import type { ReceptionListItem } from '../../services';

export function buildReceptionListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<ReceptionListItem>(
    {
      entityName: tr('inventory.mouvement.reception.entityName'),
      entityNamePlural: tr('inventory.mouvement.reception.entityNamePlural'),
      columns: buildReceptionColumns(t),
      routes: RECEPTION_PANEL_ROUTES,
      permissionPrefix: 'stock.reception',
    },
    {
      actions: {
        prependActions: [
          {
            id: 'scan_bl',
            label: tr('inventory.mouvement.reception.actions.scanBl'),
            icon: 'file-plus',
            scope: 'global',
            variant: 'primary',
            permission: 'stock.reception.create',
            ariaLabel: tr('inventory.mouvement.reception.actions.scanBl'),
          },
        ],
        overrideActions: {
          new: {
            label: tr('inventory.mouvement.reception.actions.newReception'),
            ariaLabel: tr('inventory.mouvement.reception.actions.newReception'),
          },
        },
      },
      filters: buildReceptionFilters(t),
      defaultSort: { column: 'txDate', direction: 'desc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'download',
        title: tr('inventory.mouvement.reception.list.emptyState.title'),
        message: tr('inventory.mouvement.reception.list.emptyState.message'),
      },
    },
  );
}
