import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { ConditionPaiement } from '@applications/erp/finance/models';

import { buildConditionPaiementFields } from './fields';
import { ROUTES } from './routes';
import { buildConditionPaiementSections } from './sections';

export function buildConditionPaiementDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<ConditionPaiement>(
    {
      entityName: tr('finance.conditionPaiement.entityName'),
      icon: 'calendar-clock',
      permissionPrefix: 'finance.config.conditionsPaiement',
      fields: buildConditionPaiementFields(t),
      routes: ROUTES,
    },
    {
      sections: buildConditionPaiementSections(t),
      saveSuccessMessage: (item) =>
        `${tr('finance.common.toasts.saved')} (${(item as ConditionPaiement).code})`,
      deleteConfirm: {
        title: tr('finance.common.actions.delete'),
        message: () => tr('finance.common.confirm.delete'),
      },
    },
  );
}
