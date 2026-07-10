import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildConditionPaiementFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'type',
      label: tr('finance.conditionPaiement.list.filters.type'),
      type: 'select',
      lookupKey: 'conditionPaiementType',
    },
    {
      key: 'isActive',
      label: tr('finance.common.filters.status'),
      type: 'select',
      options: [
        { value: 'true', label: tr('finance.common.labels.all') },
        { value: 'false', label: tr('finance.common.labels.none') },
      ],
    },
  ];
}
