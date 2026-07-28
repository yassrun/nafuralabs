import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

export function buildFamilleColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.famille.list.columns.code'),
      field: 'code',
      type: 'text',
      sortable: true,
      width: '160px',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.famille.list.columns.name'),
      field: 'name',
      type: 'text',
      sortable: true,
    },
    {
      key: 'description',
      label: tr('inventory.configuration.famille.list.columns.description'),
      field: 'description',
      type: 'text',
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.famille.list.columns.isActive'),
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('inventory.common.active') : tr('inventory.common.inactive')),
    },
  ];
}
