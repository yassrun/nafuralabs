import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { TauxChange } from '@applications/erp/finance/models';

import { buildTauxChangeFields } from './fields';
import { ROUTES } from './routes';
import { buildTauxChangeSections } from './sections';

export function buildTauxChangeDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<TauxChange>(
    {
      entityName: tr('finance.tauxChange.entityName'),
      icon: 'trending-up',
      permissionPrefix: 'finance.config.tauxChange',
      fields: buildTauxChangeFields(t),
      routes: ROUTES,
    },
    {
      sections: buildTauxChangeSections(t),
      saveSuccessMessage: (item) => {
        const item2 = item as TauxChange;
        return tr('finance.tauxChange.toasts.saved') + ` (${item2.deviseDeCode} → ${item2.deviseVersCode} = ${item2.taux})`;
      },
      deleteConfirm: {
        title: tr('finance.tauxChange.actions.delete'),
        message: () => tr('finance.common.confirm.delete'),
      },
    },
  );
}
