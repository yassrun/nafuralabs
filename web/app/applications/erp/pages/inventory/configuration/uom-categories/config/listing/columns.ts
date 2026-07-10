import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

export function buildUomCategoryColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.uomCategory.list.columns.code'),
      field: 'code',
      sortable: true,
    },
    {
      key: 'name',
      label: tr('inventory.configuration.uomCategory.list.columns.name'),
      field: 'name',
      sortable: true,
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.uomCategory.list.columns.isActive'),
      field: 'isActive',
      type: 'boolean',
    },
  ];
}
