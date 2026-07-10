import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  VALIDE: 'success',
  BROUILLON: 'warning',
};

export function buildSortieColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txNumber',
      label: tr('inventory.mouvement.sortie.list.columns.txNumber'),
      field: 'txNumber',
      type: 'text',
      sortable: true,
      width: '150px',
    },
    {
      key: 'txDate',
      label: tr('inventory.mouvement.sortie.list.columns.txDate'),
      field: 'txDate',
      type: 'date',
      sortable: true,
      width: '110px',
    },
    {
      key: 'sourceLocationName',
      label: tr('inventory.mouvement.sortie.list.columns.sourceLocationName'),
      field: 'sourceLocationName',
      type: 'text',
      sortable: true,
      width: '200px',
    },
    {
      key: 'chantierRef',
      label: tr('inventory.mouvement.sortie.list.columns.chantierRef'),
      field: 'chantierRef',
      type: 'text',
      sortable: true,
    },
    {
      key: 'motifName',
      label: tr('inventory.mouvement.sortie.list.columns.motifName'),
      field: 'motifName',
      type: 'text',
      width: '180px',
    },
    {
      key: 'totalValue',
      label: tr('inventory.mouvement.sortie.list.columns.totalValue'),
      field: 'totalValue',
      type: 'currency',
      sortable: true,
      width: '120px',
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.sortie.list.columns.reference'),
      field: 'reference',
      type: 'text',
      width: '120px',
    },
    {
      key: 'status',
      label: tr('inventory.mouvement.sortie.list.columns.status'),
      field: 'status',
      type: 'badge',
      width: '110px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) => {
        const key = `inventory.mouvement.sortie.status.${String(v)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(v ?? '') : resolved;
      },
    },
  ];
}
