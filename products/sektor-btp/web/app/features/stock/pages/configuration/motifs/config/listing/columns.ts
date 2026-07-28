import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const TX_VARIANTS: Record<string, 'default' | 'success' | 'info' | 'danger' | 'warning'> = {
  RECEPTION: 'success',
  TRANSFERT: 'info',
  PERTE: 'danger',
  SORTIE: 'warning',
};

export function buildMotifColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.motif.list.columns.code'),
      field: 'code',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.motif.list.columns.name'),
      field: 'name',
      type: 'text',
      sortable: true,
    },
    {
      key: 'txType',
      label: tr('inventory.configuration.motif.list.columns.txType'),
      field: 'txType',
      type: 'badge',
      width: '160px',
      badgeVariant: (value: unknown) => TX_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) => {
        const key = `inventory.enums.txType.${String(value)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(value ?? '') : resolved;
      },
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.motif.list.columns.isActive'),
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('inventory.common.active') : tr('inventory.common.inactive')),
    },
  ];
}
