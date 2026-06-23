import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { AO_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

export function buildAoFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status', label: tr('achats.appelOffre.list.filters.status'), type: 'select',
      options: [
        { value: 'BROUILLON', label: tr(AO_STATUS_KEYS.BROUILLON) },
        { value: 'PUBLIEE', label: tr(AO_STATUS_KEYS.PUBLIEE) },
        { value: 'CLOTUREE', label: tr(AO_STATUS_KEYS.CLOTUREE) },
        { value: 'ATTRIBUEE', label: tr(AO_STATUS_KEYS.ATTRIBUEE) },
        { value: 'INFRUCTUEUSE', label: tr(AO_STATUS_KEYS.INFRUCTUEUSE) },
      ],
    },
    { key: 'dateFrom', label: tr('achats.appelOffre.list.filters.dateFrom'), type: 'date' },
    { key: 'dateTo', label: tr('achats.appelOffre.list.filters.dateTo'), type: 'date' },
  ];
}
