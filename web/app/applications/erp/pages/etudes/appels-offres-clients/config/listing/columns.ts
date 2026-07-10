import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import {
  AO_CLIENT_STATUS_KEYS,
  AO_CLIENT_TYPE_KEYS,
} from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  A_ETUDIER: 'default',
  EN_PREPARATION: 'warning',
  SOUMIS: 'info',
  ATTRIBUE: 'success',
  PERDU: 'danger',
  INFRUCTUEUX: 'default',
  ANNULE: 'default',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildAocColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  return [
    {
      key: 'numero',
      label: 'N°',
      field: 'numero',
      type: 'text',
      sortable: true,
      width: '160px',
    },
    {
      key: 'donneurOrdre',
      label: "Donneur d'ordre",
      field: 'donneurOrdre',
      type: 'text',
      sortable: true,
      width: '220px',
    },
    {
      key: 'objet',
      label: 'Objet',
      field: 'objet',
      type: 'text',
      sortable: true,
    },
    {
      key: 'type',
      label: tr('chantiers.common.fields.type'),
      field: 'type',
      type: 'badge',
      sortable: true,
      width: '90px',
      badgeVariant: (v: unknown) => (v === 'PUBLIC' ? 'info' : 'default'),
      transform: (v: unknown) =>
        translateOrEmpty(t, AO_CLIENT_TYPE_KEYS[v as keyof typeof AO_CLIENT_TYPE_KEYS] ?? '') ||
        String(v ?? ''),
    },
    {
      key: 'dateLimiteDepot',
      label: 'Date limite',
      field: 'dateLimiteDepot',
      type: 'text',
      sortable: true,
      width: '120px',
      transform: (v: unknown) => {
        if (typeof v !== 'string' || !v) return '—';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(locale);
      },
    },
    {
      key: 'delaiRestant',
      label: 'Délai (j)',
      field: 'delaiRestant',
      type: 'badge',
      sortable: true,
      width: '110px',
      badgeVariant: (v: unknown) => {
        const n = typeof v === 'number' ? v : Number(v);
        if (Number.isNaN(n)) return 'default';
        if (n < 0) return 'danger';
        if (n < 7) return 'danger';
        if (n < 30) return 'warning';
        return 'success';
      },
      transform: (v: unknown) => {
        const n = typeof v === 'number' ? v : Number(v);
        if (Number.isNaN(n)) return '—';
        if (n < 0) return `Échu (-${Math.abs(n)} j)`;
        return `${n} j`;
      },
    },
    {
      key: 'estimationMoaHt',
      label: 'Estim. MOA HT',
      field: 'estimationMoaHt',
      type: 'number',
      sortable: true,
      width: '140px',
      transform: (v: unknown) =>
        typeof v === 'number'
          ? v.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MAD'
          : '—',
    },
    {
      key: 'cautionProvisoire',
      label: 'Caution prov.',
      field: 'cautionProvisoire',
      type: 'number',
      sortable: true,
      width: '130px',
      transform: (v: unknown) =>
        typeof v === 'number'
          ? v.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MAD'
          : '—',
    },
    {
      key: 'status',
      label: tr('chantiers.common.fields.statut'),
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) =>
        translateOrEmpty(t, AO_CLIENT_STATUS_KEYS[v as keyof typeof AO_CLIENT_STATUS_KEYS] ?? '') ||
        String(v ?? ''),
    },
  ];
}
