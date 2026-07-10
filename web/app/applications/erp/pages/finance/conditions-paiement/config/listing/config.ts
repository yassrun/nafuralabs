import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { ConditionPaiement } from '@applications/erp/finance/models';

import { buildConditionPaiementColumns } from './columns';
import { buildConditionPaiementFilters } from './filters';
import { ROUTES } from './routes';

export function buildConditionPaiementListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<ConditionPaiement>(
    {
      entityName: tr('finance.conditionPaiement.entityName'),
      entityNamePlural: tr('finance.conditionPaiement.entityNamePlural'),
      columns: buildConditionPaiementColumns(t),
      routes: ROUTES,
      permissionPrefix: 'finance.config.conditionsPaiement',
    },
    {
      filters: buildConditionPaiementFilters(t),
      defaultSort: { column: 'code', direction: 'asc' },
      features: {
        search: true,
        filters: true,
        columnToggle: false,
        selectionMode: 'none',
        viewModeToggle: false,
        importExport: true,
        refresh: true,
      },
      emptyState: {
        icon: 'calendar-clock',
        title: tr('finance.conditionPaiement.title'),
        message: tr('finance.conditionPaiement.subtitle'),
        actionLabel: tr('finance.common.actions.create'),
        actionId: 'create',
      },
    },
  );
}
