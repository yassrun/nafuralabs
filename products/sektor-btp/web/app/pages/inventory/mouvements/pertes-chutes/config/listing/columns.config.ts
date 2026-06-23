import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning'> = {
  VALIDE: 'success',
  BROUILLON: 'warning',
};

export function buildPerteColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txNumber',
      label: tr('inventory.mouvement.perte.list.columns.txNumber'),
      field: 'txNumber',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'txDate',
      label: tr('inventory.mouvement.perte.list.columns.txDate'),
      field: 'txDate',
      type: 'date',
      sortable: true,
      width: '110px',
    },
    {
      key: 'chantierRef',
      label: tr('inventory.mouvement.perte.list.columns.chantierRef'),
      field: 'chantierRef',
      type: 'text',
      sortable: true,
      cssClass: 'perte-list__chantier',
    },
    {
      key: 'motifName',
      label: tr('inventory.mouvement.perte.list.columns.motifName'),
      field: 'motifName',
      type: 'text',
      width: '140px',
    },
    {
      key: 'totalValue',
      label: tr('inventory.mouvement.perte.list.columns.totalValue'),
      field: 'totalValue',
      type: 'currency',
      sortable: true,
      width: '130px',
      cssClass: 'perte-list__value',
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.perte.list.columns.reference'),
      field: 'reference',
      type: 'text',
      width: '120px',
    },
    {
      key: 'status',
      label: tr('inventory.mouvement.perte.list.columns.status'),
      field: 'status',
      type: 'badge',
      width: '110px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) => {
        const key = `inventory.mouvement.perte.status.${String(v)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(v ?? '') : resolved;
      },
    },
  ];
}
