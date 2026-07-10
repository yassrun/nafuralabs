import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { AVOIR_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

export function buildAvoirFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status',
      label: tr('ventes.avoir.list.filters.status'),
      type: 'select',
      options: (Object.keys(AVOIR_STATUS_KEYS) as Array<keyof typeof AVOIR_STATUS_KEYS>).map(
        (value) => ({ value, label: tr(AVOIR_STATUS_KEYS[value]) }),
      ),
    },
    {
      key: 'clientId',
      label: tr('ventes.avoir.list.filters.client'),
      type: 'select',
      lookupKey: 'clients',
    },
    { key: 'dateFrom', label: tr('ventes.avoir.list.filters.dateFrom'), type: 'date' },
    { key: 'dateTo', label: tr('ventes.avoir.list.filters.dateTo'), type: 'date' },
  ];
}
