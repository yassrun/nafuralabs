import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { SITUATION_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  BROUILLON: 'default',
  SOUMISE: 'warning',
  VALIDEE_MOA: 'info',
  FACTUREE: 'info',
  PAYEE: 'success',
  REJETEE: 'danger',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildSituationsColumns(t: TranslateService): ColumnConfig[] {
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
      label: tr('chantiers.situation.list.columns.numero'),
      field: 'numero',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'chantierCode',
      label: tr('chantiers.situation.list.columns.chantier'),
      field: 'chantierCode',
      type: 'text',
      sortable: true,
      width: '120px',
      transform: (v: unknown) => (v as string) || '—',
      cellAction: 'openChantier',
    },
    {
      key: 'chantierName',
      label: tr('chantiers.situation.list.columns.chantierName'),
      field: 'chantierName',
      type: 'text',
      sortable: true,
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'numeroOrdre',
      label: tr('chantiers.situation.list.columns.numeroOrdre'),
      field: 'numeroOrdre',
      type: 'number',
      sortable: true,
      width: '70px',
    },
    {
      key: 'datePeriodeFin',
      label: tr('chantiers.situation.list.columns.periode'),
      field: 'datePeriodeFin',
      type: 'text',
      sortable: true,
      width: '110px',
      transform: fmtDate,
    },
    {
      key: 'cumulCourantHt',
      label: tr('chantiers.situation.list.columns.cumulHt'),
      field: 'cumulCourantHt',
      type: 'currency',
      sortable: true,
      width: '140px',
    },
    {
      key: 'travauxPeriodeHt',
      label: tr('chantiers.situation.list.columns.travauxPeriode'),
      field: 'travauxPeriodeHt',
      type: 'currency',
      sortable: true,
      width: '140px',
    },
    {
      key: 'retenueGarantieMontant',
      label: tr('chantiers.situation.list.columns.retenue7'),
      field: 'retenueGarantieMontant',
      type: 'currency',
      sortable: true,
      width: '120px',
    },
    {
      key: 'netAPayerHt',
      label: tr('chantiers.situation.list.columns.netHt'),
      field: 'netAPayerHt',
      type: 'currency',
      sortable: true,
      width: '140px',
    },
    {
      key: 'netAPayerTtc',
      label: tr('chantiers.situation.list.columns.netTtc'),
      field: 'netAPayerTtc',
      type: 'currency',
      sortable: true,
      width: '140px',
    },
    {
      key: 'status',
      label: tr('chantiers.situation.list.columns.status'),
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) =>
        translateOrEmpty(t, SITUATION_STATUS_KEYS[v as keyof typeof SITUATION_STATUS_KEYS] ?? '') ||
        String(v ?? ''),
    },
    {
      key: 'delaiAttente',
      label: tr('chantiers.situation.list.columns.delaiAttente'),
      field: 'delaiAttente',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeVariant: (v: unknown) => {
        if (v == null || v === '') return 'default';
        const n = Number(v);
        if (!Number.isFinite(n)) return 'default';
        if (n > 60) return 'danger';
        if (n > 30) return 'warning';
        return 'success';
      },
      transform: (v: unknown) => {
        if (v == null || v === '') return '—';
        const n = Number(v);
        return Number.isFinite(n)
          ? tr('chantiers.situation.list.delai.joursShort').replace('{n}', String(n))
          : '—';
      },
    },
  ];
}
