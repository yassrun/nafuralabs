import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { DEVIS_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  BROUILLON: 'default',
  EMIS: 'info',
  NEGOCIATION: 'warning',
  APPROUVE: 'success',
  PERDU: 'danger',
  ANNULE: 'default',
  EXPIRE: 'warning',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildDevisColumns(t: TranslateService): ColumnConfig[] {
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
      label: 'N°',
      field: 'numero',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'version',
      label: 'V.',
      field: 'version',
      type: 'number',
      width: '60px',
      transform: (v: unknown) => `V${v ?? 1}`,
    },
    {
      key: 'clientName',
      label: tr('chantiers.common.fields.client'),
      field: 'clientName',
      type: 'text',
      sortable: true,
      width: '220px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'objet',
      label: 'Objet',
      field: 'objet',
      type: 'text',
    },
    {
      key: 'dateEmission',
      label: tr('chantiers.common.fields.dateEmission'),
      field: 'dateEmission',
      type: 'text',
      sortable: true,
      width: '110px',
      transform: fmtDate,
    },
    {
      key: 'dateValidite',
      label: 'Validité',
      field: 'dateValidite',
      type: 'text',
      sortable: true,
      width: '110px',
      transform: fmtDate,
    },
    {
      key: 'totalHt',
      label: tr('chantiers.common.fields.totalHt') + ' (MAD)',
      field: 'totalHt',
      type: 'currency',
      sortable: true,
      width: '160px',
    },
    {
      key: 'totalTtc',
      label: tr('chantiers.common.fields.totalTtc') + ' (MAD)',
      field: 'totalTtc',
      type: 'currency',
      sortable: true,
      width: '160px',
    },
    {
      key: 'status',
      label: tr('chantiers.common.fields.statut'),
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '120px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) =>
        translateOrEmpty(t, DEVIS_STATUS_KEYS[v as keyof typeof DEVIS_STATUS_KEYS] ?? '') ||
        String(v ?? ''),
    },
  ];
}
