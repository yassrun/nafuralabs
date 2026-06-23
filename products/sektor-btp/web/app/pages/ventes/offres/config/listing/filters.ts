import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { OFFRE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

export function buildOffreFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status',
      label: tr('ventes.offre.list.filters.status'),
      type: 'select',
      options: (Object.keys(OFFRE_STATUS_KEYS) as Array<keyof typeof OFFRE_STATUS_KEYS>).map(
        (value) => ({ value, label: tr(OFFRE_STATUS_KEYS[value]) }),
      ),
    },
    { key: 'clientId', label: tr('ventes.offre.list.filters.clientId'), type: 'text' },
  ];
}
