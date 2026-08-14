import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

function fmtDate(v: unknown, dash: string): string {
  if (typeof v !== 'string' || !v) return dash;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

function fmtRate(v: unknown, dash: string): string {
  return typeof v === 'number'
    ? v.toLocaleString(undefined, { minimumFractionDigits: 4 })
    : dash;
}

export function buildTauxChangeColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const dash = tr('finance.common.dash');
  const sourceLabels: Record<string, string> = {
    BAM: tr('finance.tauxChange.source.BAM'),
    MANUEL: tr('finance.tauxChange.source.MANUEL'),
    API: tr('finance.tauxChange.source.IMPORT'),
  };
  const actifLabel = tr('finance.tauxChange.list.columns.actions');

  return [
    {
      key: 'dateValidite',
      label: tr('finance.tauxChange.list.columns.dateCotation'),
      field: 'dateValidite',
      type: 'text',
      sortable: true,
      width: '130px',
      transform: (v: unknown) => fmtDate(v, dash),
    },
    {
      key: 'pair',
      label: tr('finance.tauxChange.list.columns.deviseBase'),
      field: 'deviseDeCode',
      sortable: false,
      transform: (_v: unknown, row?: unknown) => {
        const r = row as { deviseDeCode?: string; deviseVersCode?: string } | undefined;
        if (!r) return dash;
        return `${r.deviseDeCode ?? ''} → ${r.deviseVersCode ?? ''}`;
      },
    },
    {
      key: 'taux',
      label: tr('finance.tauxChange.list.columns.taux'),
      field: 'taux',
      type: 'number',
      sortable: true,
      width: '120px',
      transform: (v: unknown) => fmtRate(v, dash),
    },
    {
      key: 'source',
      label: tr('finance.tauxChange.list.columns.source'),
      field: 'source',
      type: 'badge',
      width: '160px',
      badgeVariant: (v: unknown) => (v === 'BAM' ? 'success' : 'info'),
      transform: (v: unknown) => sourceLabels[String(v)] ?? String(v ?? dash),
    },
    {
      key: 'isActive',
      label: actifLabel,
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) =>
        v ? tr('finance.common.labels.all') : tr('finance.common.labels.none'),
    },
  ];
}
