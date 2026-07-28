import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildUomFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.uom.list.columns.code'),
      type: 'text',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.uom.list.columns.name'),
      type: 'text',
    },
  ];
}
