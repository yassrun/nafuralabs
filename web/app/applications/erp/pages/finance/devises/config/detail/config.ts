import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { Devise } from '@applications/erp/finance/models';

import { buildDeviseFields } from './fields';
import { ROUTES } from './routes';
import { buildDeviseSections } from './sections';

export function buildDeviseDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Devise>(
    {
      entityName: tr('finance.devise.entityName'),
      icon: 'circle-dollar-sign',
      permissionPrefix: 'finance.config.devise',
      fields: buildDeviseFields(t),
      routes: ROUTES,
    },
    {
      sections: buildDeviseSections(t),
      saveSuccessMessage: (item) =>
        tr('finance.devise.toasts.saved') + ` ${(item as Devise).code} — ${(item as Devise).libelle}`,
      deleteConfirm: {
        title: tr('finance.devise.deleteConfirm.title'),
        message: (item) =>
          t.instant('finance.devise.deleteConfirm.message', { code: (item as Devise).code }),
      },
    },
  );
}
