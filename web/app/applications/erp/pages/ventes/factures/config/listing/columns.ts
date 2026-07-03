import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import {
  FACTURE_STATUS_KEYS,
  FACTURE_TYPE_KEYS,
} from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  BROUILLON: 'default',
  EMISE: 'info',
  PARTIELLEMENT_PAYEE: 'warning',
  PAYEE: 'success',
  EN_LITIGE: 'danger',
  AVOIRISEE: 'default',
  ANNULEE: 'default',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildFactureColumns(t: TranslateService): ColumnConfig[] {
  const tr = (key: string) => t.instant(key);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (typeof v !== 'string' || !v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(locale);
  };
  return [
    {
      key: 'numero',
      label: tr('ventes.facture.list.columns.numero'),
      field: 'numero',
      type: 'text',
      sortable: true,
      width: '150px',
    },
    {
      key: 'type',
      label: tr('ventes.facture.list.columns.type'),
      field: 'type',
      type: 'text',
      sortable: true,
      width: '120px',
      transform: (v: unknown) =>
        translateOrEmpty(t, FACTURE_TYPE_KEYS[v as keyof typeof FACTURE_TYPE_KEYS] ?? '') ||
        String(v ?? ''),
    },
    {
      key: 'clientName',
      label: tr('ventes.facture.list.columns.client'),
      field: 'clientName',
      type: 'text',
      sortable: true,
      width: '200px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'chantierCode',
      label: tr('ventes.facture.list.columns.chantier'),
      field: 'chantierCode',
      type: 'text',
      sortable: true,
      width: '120px',
      transform: (v: unknown) => (v as string) || '—',
      cellAction: 'openChantier',
    },
    {
      key: 'dateEmission',
      label: tr('ventes.facture.list.columns.dateEmission'),
      field: 'dateEmission',
      type: 'text',
      sortable: true,
      width: '110px',
      transform: fmtDate,
    },
    {
      key: 'dateEcheance',
      label: tr('ventes.facture.list.columns.dateEcheance'),
      field: 'dateEcheance',
      type: 'text',
      sortable: true,
      width: '110px',
      transform: fmtDate,
    },
    {
      key: 'netAPayerTtc',
      label: tr('ventes.facture.list.columns.netTtc'),
      field: 'netAPayerTtc',
      type: 'currency',
      sortable: true,
      width: '150px',
    },
    {
      key: 'cumulEncaisseTtc',
      label: tr('ventes.facture.list.columns.encaisse'),
      field: 'cumulEncaisseTtc',
      type: 'currency',
      sortable: true,
      width: '140px',
    },
    {
      key: 'resteTtc',
      label: tr('ventes.facture.list.columns.resteTtc'),
      field: 'resteTtc',
      type: 'currency',
      sortable: true,
      width: '140px',
    },
    {
      key: 'delaiRetard',
      label: tr('ventes.facture.list.columns.retard'),
      field: 'delaiRetard',
      type: 'number',
      sortable: true,
      width: '100px',
      transform: (v: unknown) => {
        const n = Number(v ?? 0);
        if (n <= 0) return '—';
        return tr('ventes.facture.list.transform.retardJ').replace('{n}', String(n));
      },
    },
    {
      key: 'status',
      label: tr('ventes.facture.list.columns.status'),
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) =>
        translateOrEmpty(t, FACTURE_STATUS_KEYS[v as keyof typeof FACTURE_STATUS_KEYS] ?? '') ||
        String(v ?? ''),
    },
  ];
}
