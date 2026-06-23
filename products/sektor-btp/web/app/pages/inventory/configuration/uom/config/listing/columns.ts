import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

export function buildUomColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.uom.list.columns.code'),
      field: 'code',
      type: 'text',
      sortable: true,
      width: '100px',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.uom.list.columns.name'),
      field: 'name',
      type: 'text',
      sortable: true,
    },
    {
      key: 'uomCategoryName',
      label: tr('inventory.configuration.uom.list.columns.uomCategoryId'),
      field: 'uomCategoryName',
      type: 'text',
      width: '180px',
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.uom.list.columns.isActive'),
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('inventory.common.active') : tr('inventory.common.inactive')),
    },
  ];
}
