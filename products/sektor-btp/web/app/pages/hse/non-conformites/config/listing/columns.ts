import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { NC_STATUS_KEYS, NC_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const TYPE_VARIANTS: Record<string, 'danger' | 'warning' | 'info' | 'info'> = {
  SECURITE: 'danger', QUALITE: 'warning',
  ENVIRONNEMENT: 'info', REGLEMENTAIRE: 'info',
};

const STATUS_VARIANTS: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  OUVERTE: 'danger', EN_COURS: 'warning',
  VERIFIEE: 'info', CLOTUREE: 'default',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildNcColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (!v) return '—';
    const d = new Date(v as string);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(locale);
  };
  return [
    { key: 'numero', label: tr('hse.nonConformite.list.columns.numero'), field: 'numero', type: 'text', sortable: true, width: '130px' },
    { key: 'date', label: tr('hse.nonConformite.list.columns.date'), field: 'date', type: 'text', sortable: true, width: '110px', transform: fmtDate },
    {
      key: 'type', label: tr('hse.nonConformite.list.columns.type'), field: 'type', type: 'badge', sortable: true, width: '140px',
      transform: (v) => translateOrEmpty(t, NC_TYPE_KEYS[v as keyof typeof NC_TYPE_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => TYPE_VARIANTS[String(v)] ?? 'default',
    },
    {
      key: 'chantierCode',
      label: tr('hse.nonConformite.list.columns.chantier'),
      field: 'chantierCode',
      type: 'text',
      sortable: true,
      width: '130px',
      transform: (v) => String(v ?? '—'),
      cellAction: 'openChantier',
    },
    { key: 'description', label: tr('hse.nonConformite.list.columns.description'), field: 'description', type: 'text', sortable: false },
    { key: 'dateEcheance', label: tr('hse.nonConformite.list.columns.echeance'), field: 'dateEcheance', type: 'text', sortable: true, width: '120px', transform: fmtDate },
    {
      key: 'status', label: tr('hse.nonConformite.list.columns.statut'), field: 'status', type: 'badge', sortable: true, width: '120px',
      transform: (v) => translateOrEmpty(t, NC_STATUS_KEYS[v as keyof typeof NC_STATUS_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => STATUS_VARIANTS[String(v)] ?? 'default',
    },
  ];
}
