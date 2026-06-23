import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { GRAVITE_KEYS, INCIDENT_STATUS_KEYS, INCIDENT_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const GRAVITE_VARIANTS: Record<string, 'default' | 'warning' | 'danger'> = {
  SANS_ARRET: 'default', AVEC_ARRET: 'warning',
  GRAVE: 'danger', MORTEL: 'danger',
};

const STATUS_VARIANTS: Record<string, 'info' | 'warning' | 'default'> = {
  DECLARE: 'info', EN_INVESTIGATION: 'warning', CLOTURE: 'default',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildIncidentColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (!v) return '—';
    const d = new Date(v as string);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(locale);
  };
  return [
    { key: 'numero', label: tr('hse.incident.list.columns.numero'), field: 'numero', type: 'text', sortable: true, width: '130px' },
    { key: 'date', label: tr('hse.incident.list.columns.date'), field: 'date', type: 'text', sortable: true, width: '110px', transform: fmtDate },
    {
      key: 'typeIncident',
      label: tr('hse.incident.list.columns.type'),
      field: 'typeIncident',
      type: 'text',
      sortable: true,
      width: '120px',
      transform: (v) => translateOrEmpty(t, INCIDENT_TYPE_KEYS[v as keyof typeof INCIDENT_TYPE_KEYS] ?? '') || (v ? String(v) : '—'),
    },
    { key: 'lieu', label: tr('hse.incident.list.columns.lieu'), field: 'lieu', type: 'text', sortable: true },
    {
      key: 'chantierCode',
      label: tr('hse.incident.list.columns.chantier'),
      field: 'chantierCode',
      type: 'text',
      sortable: true,
      width: '130px',
      transform: (v) => String(v ?? '—'),
      cellAction: 'openChantier',
    },
    {
      key: 'gravite', label: tr('hse.incident.list.columns.gravite'), field: 'gravite', type: 'badge', sortable: true, width: '120px',
      transform: (v) => translateOrEmpty(t, GRAVITE_KEYS[v as keyof typeof GRAVITE_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => GRAVITE_VARIANTS[String(v)] ?? 'default',
    },
    {
      key: 'joursArret', label: tr('hse.incident.list.columns.joursArret'), field: 'joursArret', type: 'text', width: '100px',
      transform: (v) => (v != null && v !== undefined && v !== '') ? tr('hse.incident.list.transform.joursSuffix').replace('{n}', String(v)) : '—',
    },
    {
      key: 'status', label: tr('hse.incident.list.columns.statut'), field: 'status', type: 'badge', sortable: true, width: '140px',
      transform: (v) => translateOrEmpty(t, INCIDENT_STATUS_KEYS[v as keyof typeof INCIDENT_STATUS_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => STATUS_VARIANTS[String(v)] ?? 'default',
    },
  ];
}
