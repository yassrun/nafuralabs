import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildCostingMethodFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.costingMethod.list.columns.code'),
      type: 'text',
    },
    {
      key: 'method',
      label: tr('inventory.configuration.costingMethod.list.filters.method'),
      type: 'select',
      options: [
        { value: 'AVCO', label: tr('inventory.enums.costingMethod.AVCO') },
        { value: 'FIFO', label: tr('inventory.enums.costingMethod.FIFO') },
        { value: 'STD', label: tr('inventory.enums.costingMethod.STD') },
      ],
    },
  ];
}
