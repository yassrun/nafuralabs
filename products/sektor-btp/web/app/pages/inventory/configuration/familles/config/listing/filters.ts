import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildFamilleFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.famille.list.filters.code'),
      type: 'text',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.famille.list.filters.name'),
      type: 'text',
    },
  ];
}
