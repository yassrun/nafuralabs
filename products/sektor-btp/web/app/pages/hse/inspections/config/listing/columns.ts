import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { INSPECTION_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<string, 'info' | 'info' | 'success' | 'default'> = {
  PLANIFIEE: 'info', EN_COURS: 'info',
  TERMINEE: 'success', ANNULEE: 'default',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildInspectionColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (!v) return '—';
    const d = new Date(v as string);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(locale);
  };
  return [
    { key: 'numero', label: tr('hse.inspection.list.columns.numero'), field: 'numero', type: 'text', sortable: true, width: '130px' },
    { key: 'dateInspection', label: tr('hse.inspection.list.columns.date'), field: 'dateInspection', type: 'text', sortable: true, width: '120px', transform: fmtDate },
    {
      key: 'chantierCode',
      label: tr('hse.inspection.list.columns.chantier'),
      field: 'chantierCode',
      type: 'text',
      sortable: true,
      width: '130px',
      transform: (v) => String(v ?? '—'),
      cellAction: 'openChantier',
    },
    { key: 'inspecteurNom', label: tr('hse.inspection.list.columns.inspecteur'), field: 'inspecteurNom', type: 'text', sortable: true },
    { key: 'thematique', label: tr('hse.inspection.list.columns.thematique'), field: 'thematique', type: 'text', sortable: false },
    {
      key: 'noteGlobale', label: tr('hse.inspection.list.columns.note'), field: 'noteGlobale', type: 'text', width: '80px',
      transform: (v) => (v != null && v !== undefined && v !== '') ? tr('hse.inspection.list.transform.noteSuffix').replace('{n}', String(v)) : '—',
    },
    { key: 'nbNonConformites', label: tr('hse.inspection.list.columns.nc'), field: 'nbNonConformites', type: 'number', sortable: true, width: '60px' },
    {
      key: 'status', label: tr('hse.inspection.list.columns.statut'), field: 'status', type: 'badge', sortable: true, width: '120px',
      transform: (v) => translateOrEmpty(t, INSPECTION_STATUS_KEYS[v as keyof typeof INSPECTION_STATUS_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => STATUS_VARIANTS[String(v)] ?? 'default',
    },
  ];
}
