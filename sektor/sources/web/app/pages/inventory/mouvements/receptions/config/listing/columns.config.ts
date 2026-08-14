import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  VALIDE: 'success',
  BROUILLON: 'warning',
  ANNULE: 'danger',
};

export function buildReceptionColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  return [
    {
      key: 'txNumber',
      field: 'txNumber',
      label: tr('inventory.mouvement.reception.list.columns.txNumber'),
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'txDate',
      field: 'txDate',
      label: tr('inventory.mouvement.reception.list.columns.txDate'),
      type: 'text',
      sortable: true,
      width: '110px',
      transform: (v: unknown) => {
        if (typeof v !== 'string' || !v) return tr('inventory.mouvement.common.notSet');
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(locale);
      },
    },
    {
      key: 'fournisseurName',
      field: 'fournisseurName',
      label: tr('inventory.mouvement.reception.list.columns.fournisseurName'),
      type: 'text',
      sortable: false,
      transform: (v: unknown) => (v as string) || tr('inventory.mouvement.common.notSet'),
    },
    {
      key: 'destLocationName',
      field: 'destLocationName',
      label: tr('inventory.mouvement.reception.list.columns.destLocationName'),
      type: 'text',
      sortable: false,
      transform: (v: unknown) => (v as string) || tr('inventory.mouvement.common.notSetFem'),
    },
    {
      key: 'reference',
      field: 'reference',
      label: tr('inventory.mouvement.reception.list.columns.reference'),
      type: 'text',
      sortable: false,
      transform: (v: unknown) => (v as string) || tr('inventory.mouvement.common.notSetFem'),
    },
    {
      key: 'bcOrigine',
      field: 'bcNumero',
      label: tr('inventory.mouvement.reception.list.columns.bcOrigine'),
      type: 'text',
      sortable: false,
      width: '150px',
      transform: (_v: unknown, item: unknown) => {
        const tx = item as { bcNumero?: string };
        return tx.bcNumero || '—';
      },
    },
    {
      key: 'status',
      field: 'status',
      label: tr('inventory.mouvement.reception.list.columns.status'),
      type: 'badge',
      sortable: true,
      width: '110px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) => {
        const key = `inventory.mouvement.reception.status.${String(v)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(v ?? '') : resolved;
      },
    },
    {
      key: 'totalValue',
      field: 'totalValue',
      label: tr('inventory.mouvement.reception.list.columns.totalValue'),
      type: 'number',
      sortable: true,
      width: '130px',
      transform: (v: unknown) =>
        typeof v === 'number'
          ? v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'
          : '0,00 MAD',
    },
  ];
}
