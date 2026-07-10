import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  VALIDE: 'success',
  BROUILLON: 'warning',
  ANNULE: 'danger',
};

export function buildInventaireColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txNumber',
      label: tr('inventory.mouvement.inventaire.list.columns.txNumber'),
      field: 'txNumber',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'txDate',
      label: tr('inventory.mouvement.inventaire.list.columns.txDate'),
      field: 'txDate',
      type: 'date',
      sortable: true,
      width: '110px',
    },
    {
      key: 'destLocationName',
      label: tr('inventory.mouvement.inventaire.list.columns.destLocationName'),
      field: 'destLocationName',
      type: 'text',
      sortable: true,
    },
    {
      key: 'linesCount',
      label: tr('inventory.mouvement.inventaire.list.columns.linesCount'),
      field: 'linesCount',
      type: 'number',
      sortable: true,
      width: '100px',
    },
    {
      key: 'totalVariance',
      label: tr('inventory.mouvement.inventaire.list.columns.totalVariance'),
      field: 'totalVariance',
      type: 'number',
      sortable: true,
      width: '110px',
      cssClass: 'inventaire-list__variance',
      transform: (value: unknown) => {
        const v = Number(value ?? 0);
        if (v === 0) return '0';
        return v > 0 ? `+${v}` : String(v);
      },
    },
    {
      key: 'status',
      label: tr('inventory.mouvement.inventaire.list.columns.status'),
      field: 'status',
      type: 'badge',
      width: '110px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) => {
        const key = `inventory.mouvement.inventaire.status.${String(v)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(v ?? '') : resolved;
      },
    },
  ];
}
