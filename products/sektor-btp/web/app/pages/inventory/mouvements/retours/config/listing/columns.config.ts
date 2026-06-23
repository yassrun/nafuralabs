import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  VALIDE: 'success',
  BROUILLON: 'warning',
  ANNULE: 'danger',
};

export function buildRetourColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txNumber',
      label: tr('inventory.mouvement.retour.list.columns.txNumber'),
      field: 'txNumber',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'txDate',
      label: tr('inventory.mouvement.retour.list.columns.txDate'),
      field: 'txDate',
      type: 'date',
      sortable: true,
      width: '110px',
    },
    {
      key: 'motifName',
      label: tr('inventory.mouvement.retour.list.columns.motifName'),
      field: 'motifName',
      type: 'text',
      sortable: true,
      width: '160px',
    },
    {
      key: 'sourceLocationName',
      label: tr('inventory.mouvement.retour.list.columns.sourceLocationName'),
      field: 'sourceLocationName',
      type: 'text',
      sortable: true,
    },
    {
      key: 'destLocationName',
      label: tr('inventory.mouvement.retour.list.columns.destLocationName'),
      field: 'destLocationName',
      type: 'text',
      sortable: true,
      transform: (value: unknown) =>
        typeof value === 'string' && value
          ? value
          : tr('inventory.mouvement.retour.list.columns.destLocationExterne'),
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.retour.list.columns.reference'),
      field: 'reference',
      type: 'text',
      width: '140px',
    },
    {
      key: 'status',
      label: tr('inventory.mouvement.retour.list.columns.status'),
      field: 'status',
      type: 'badge',
      width: '110px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) => {
        const key = `inventory.mouvement.retour.status.${String(v)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(v ?? '') : resolved;
      },
    },
  ];
}
