import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { CT_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const CT_STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  BROUILLON: 'default', SIGNE: 'info', EN_COURS: 'success', ECHU: 'warning', RESILIE: 'danger',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

const CT_TYPE_KEYS: Record<string, string> = {
  CADRE: 'achats.contratType.CADRE',
  ANNUEL: 'achats.contratType.ANNUEL',
  PONCTUEL: 'achats.contratType.PONCTUEL',
};

export function buildContratColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown) => v ? new Date(v as string).toLocaleDateString(locale) : '—';
  const fmtMad = (v: unknown) =>
    v != null ? Number(v).toLocaleString(locale, { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }) : '—';
  return [
    { key: 'numero', label: tr('achats.contrat.list.columns.numero'), field: 'numero', type: 'text', sortable: true, width: '150px' },
    { key: 'fournisseurName', label: tr('achats.contrat.list.columns.fournisseur'), field: 'fournisseurName', type: 'text', sortable: true },
    {
      key: 'type', label: tr('achats.contrat.list.columns.type'), field: 'type', type: 'badge', sortable: true, width: '110px',
      transform: (v) => translateOrEmpty(t, CT_TYPE_KEYS[String(v ?? '')] ?? '') || String(v ?? ''),
      badgeVariant: () => 'info',
    },
    { key: 'dateDebut', label: tr('achats.contrat.list.columns.dateDebut'), field: 'dateDebut', type: 'text', sortable: true, width: '100px', transform: fmtDate },
    { key: 'dateFin', label: tr('achats.contrat.list.columns.dateFin'), field: 'dateFin', type: 'text', sortable: true, width: '100px', transform: fmtDate },
    { key: 'montantPlafondHt', label: tr('achats.contrat.list.columns.montantPlafondHt'), field: 'montantPlafondHt', type: 'text', sortable: true, width: '130px', transform: fmtMad },
    { key: 'cumulBcEmisHt', label: tr('achats.contrat.list.columns.cumulBcEmisHt'), field: 'cumulBcEmisHt', type: 'text', sortable: true, width: '130px', transform: fmtMad },
    {
      key: 'consommationPercent', label: tr('achats.contrat.list.columns.consommationPercent'), field: 'consommationPercent', type: 'badge', sortable: true, width: '90px',
      transform: (v) => v != null ? `${v}%` : '—',
      badgeVariant: (v) => { const n = Number(v); return n >= 90 ? 'danger' : n >= 70 ? 'warning' : 'success'; },
    },
    {
      key: 'joursRestants', label: tr('achats.contrat.list.columns.joursRestants'), field: 'joursRestants', type: 'badge', width: '100px',
      transform: (v) => v != null ? tr('achats.contrat.list.transform.joursSuffix').replace('{n}', String(v)) : '—',
      badgeVariant: (v) => { const n = Number(v); return n < 0 ? 'danger' : n < 30 ? 'warning' : 'default'; },
    },
    {
      key: 'status', label: tr('achats.contrat.list.columns.status'), field: 'status', type: 'badge', sortable: true, width: '100px',
      transform: (v) => translateOrEmpty(t, CT_STATUS_KEYS[v as keyof typeof CT_STATUS_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => CT_STATUS_VARIANTS[String(v)] ?? 'default',
    },
  ];
}
