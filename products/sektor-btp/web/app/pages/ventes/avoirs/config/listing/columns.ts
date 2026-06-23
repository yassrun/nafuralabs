import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { AVOIR_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  BROUILLON: 'default',
  EMIS: 'info',
  IMPUTE: 'success',
  REMBOURSE: 'success',
  ANNULE: 'default',
};

function translateOrFallback(t: TranslateService, key: string, value: unknown): string {
  if (!key) return String(value ?? '');
  const resolved = t.instant(key);
  return resolved === key ? String(value ?? '') : resolved;
}

export function buildAvoirColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (typeof v !== 'string' || !v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(locale);
  };
  return [
    {
      key: 'numero',
      label: tr('ventes.avoir.list.columns.numero'),
      field: 'numero',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'factureOriginaleNumero',
      label: tr('ventes.avoir.list.columns.factureOrigine'),
      field: 'factureOriginaleNumero',
      type: 'text',
      sortable: true,
      width: '160px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'clientName',
      label: tr('ventes.avoir.list.columns.client'),
      field: 'clientName',
      type: 'text',
      sortable: true,
      width: '220px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'dateEmission',
      label: tr('ventes.avoir.list.columns.dateEmission'),
      field: 'dateEmission',
      type: 'text',
      sortable: true,
      width: '110px',
      transform: fmtDate,
    },
    {
      key: 'motif',
      label: tr('ventes.avoir.list.columns.motif'),
      field: 'motif',
      type: 'text',
    },
    {
      key: 'totalTtc',
      label: tr('ventes.avoir.list.columns.totalTtc'),
      field: 'totalTtc',
      type: 'currency',
      sortable: true,
      width: '150px',
    },
    {
      key: 'status',
      label: tr('ventes.avoir.list.columns.status'),
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) =>
        translateOrFallback(
          t,
          AVOIR_STATUS_KEYS[v as keyof typeof AVOIR_STATUS_KEYS] ?? '',
          v,
        ),
    },
  ];
}
