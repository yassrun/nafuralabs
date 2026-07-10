import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildUomCategoryFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.uomCategory.list.columns.code'),
      type: 'text',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.uomCategory.list.columns.name'),
      type: 'text',
    },
  ];
}
