import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { OFFRE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  BROUILLON: 'default',
  ENVOYEE: 'info',
  ACCEPTEE: 'success',
  REFUSEE: 'danger',
  EXPIREE: 'warning',
  ANNULEE: 'default',
};

function translateOrFallback(t: TranslateService, key: string, value: unknown): string {
  if (!key) return String(value ?? '');
  const resolved = t.instant(key);
  return resolved === key ? String(value ?? '') : resolved;
}

export function buildOffreColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (!v) return '—';
    const d = new Date(v as string);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(locale);
  };
  const fmtMad = (v: unknown): string => {
    if (v == null) return '—';
    return Number(v).toLocaleString(locale, {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    });
  };
  return [
    {
      key: 'numero',
      label: tr('ventes.offre.list.columns.numero'),
      field: 'numero',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'clientName',
      label: tr('ventes.offre.list.columns.client'),
      field: 'clientName',
      type: 'text',
      sortable: true,
      transform: (v) => String(v ?? '—'),
    },
    {
      key: 'objet',
      label: tr('ventes.offre.list.columns.objet'),
      field: 'objet',
      type: 'text',
      sortable: true,
      transform: (v) => String(v ?? '—'),
    },
    {
      key: 'dateEmission',
      label: tr('ventes.offre.list.columns.dateEmission'),
      field: 'dateEmission',
      type: 'text',
      sortable: true,
      width: '130px',
      transform: fmtDate,
    },
    {
      key: 'dateValidite',
      label: tr('ventes.offre.list.columns.dateValidite'),
      field: 'dateValidite',
      type: 'text',
      sortable: true,
      width: '130px',
      transform: fmtDate,
    },
    {
      key: 'joursValidite',
      label: tr('ventes.offre.list.columns.joursRestants'),
      field: 'joursValidite',
      type: 'text',
      width: '100px',
      transform: (v) => {
        const n = Number(v);
        if (n > 0) return tr('ventes.offre.list.transform.joursPositif').replace('{n}', String(n));
        if (n === 0) return tr('ventes.offre.list.transform.joursAujourdhui');
        return tr('ventes.offre.list.transform.joursExpire').replace('{n}', String(Math.abs(n)));
      },
    },
    {
      key: 'totalTtc',
      label: tr('ventes.offre.list.columns.totalTtc'),
      field: 'totalTtc',
      type: 'text',
      sortable: true,
      width: '150px',
      transform: fmtMad,
    },
    {
      key: 'status',
      label: tr('ventes.offre.list.columns.status'),
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '120px',
      transform: (v) =>
        translateOrFallback(t, OFFRE_STATUS_KEYS[v as keyof typeof OFFRE_STATUS_KEYS] ?? '', v),
      badgeVariant: (v) => STATUS_VARIANTS[String(v)] ?? 'default',
    },
  ];
}
