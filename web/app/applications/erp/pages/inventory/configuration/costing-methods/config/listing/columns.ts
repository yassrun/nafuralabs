import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const METHOD_VARIANTS: Record<string, 'default' | 'info' | 'success'> = {
  AVCO: 'info',
  FIFO: 'success',
  STD: 'default',
};

export function buildCostingMethodColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.costingMethod.list.columns.code'),
      field: 'code',
      type: 'text',
      sortable: true,
      width: '100px',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.costingMethod.list.columns.name'),
      field: 'name',
      type: 'text',
      sortable: true,
    },
    {
      key: 'method',
      label: tr('inventory.configuration.costingMethod.list.columns.method'),
      field: 'method',
      type: 'badge',
      width: '130px',
      badgeVariant: (value: unknown) => METHOD_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) => {
        const v = String(value);
        if (v === 'STD') return tr('inventory.enums.costingMethod.STD');
        const key = `inventory.enums.costingMethod.${v}`;
        const resolved = t.instant(key);
        return resolved === key ? v : resolved;
      },
    },
    {
      key: 'description',
      label: tr('inventory.configuration.famille.list.columns.description'),
      field: 'description',
      type: 'text',
    },
    {
      key: 'isDefault',
      label: tr('inventory.configuration.costingMethod.list.columns.isDefault'),
      field: 'isDefault',
      type: 'badge',
      width: '100px',
      badgeVariant: (v: unknown) => (v ? 'info' : 'default'),
      transform: (v: unknown) => (v ? tr('inventory.configuration.costingMethod.list.columns.isDefault') : '—'),
    },
  ];
}
