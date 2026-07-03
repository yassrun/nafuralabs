import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildDeviseFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'isActive',
      label: tr('finance.devise.list.filters.status'),
      type: 'select',
      options: [
        { value: 'true', label: tr('finance.devise.statusActive') },
        { value: 'false', label: tr('finance.devise.statusInactive') },
      ],
    },
    {
      key: 'isDeviseDeReference',
      label: tr('finance.devise.list.filters.reference'),
      type: 'select',
      options: [
        { value: 'true', label: tr('finance.devise.list.filters.referenceYes') },
        { value: 'false', label: tr('finance.devise.list.filters.referenceNo') },
      ],
    },
  ];
}
