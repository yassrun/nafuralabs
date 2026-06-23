import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { METRE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildMetreColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
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
      key: 'projetNom',
      label: 'Projet',
      field: 'projetNom',
      type: 'text',
      sortable: true,
    },
    {
      key: 'ville',
      label: tr('chantiers.common.fields.ville'),
      field: 'ville',
      type: 'text',
      sortable: true,
      width: '120px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'dateMetre',
      label: tr('chantiers.common.fields.date'),
      field: 'dateMetre',
      type: 'text',
      sortable: true,
      width: '110px',
      transform: (v: unknown) => {
        if (typeof v !== 'string' || !v) return '—';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(locale);
      },
    },
    {
      key: 'metreurName',
      label: 'Métreur',
      field: 'metreurName',
      type: 'text',
      width: '170px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'nbLignes',
      label: 'Lignes',
      field: 'nbLignes',
      type: 'number',
      sortable: true,
      width: '80px',
    },
    {
      key: 'quantiteTotaleEstimee',
      label: 'Qté totale',
      field: 'quantiteTotaleEstimee',
      type: 'number',
      sortable: true,
      width: '120px',
      transform: (v: unknown) =>
        typeof v === 'number'
          ? v.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 3 })
          : '—',
    },
    {
      key: 'status',
      label: tr('chantiers.common.fields.statut'),
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '110px',
      badgeVariant: (v: unknown) => (v === 'TERMINE' ? 'success' : 'warning'),
      transform: (v: unknown) =>
        translateOrEmpty(t, METRE_STATUS_KEYS[v as keyof typeof METRE_STATUS_KEYS] ?? '') ||
        String(v ?? ''),
    },
  ];
}
