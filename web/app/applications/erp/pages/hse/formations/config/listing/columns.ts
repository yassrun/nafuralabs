import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { FORMATION_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<string, 'info' | 'info' | 'success' | 'default'> = {
  PLANIFIEE: 'info', EN_COURS: 'info', TERMINEE: 'success', ANNULEE: 'default',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildFormationColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (!v) return '—';
    const d = new Date(v as string);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(locale);
  };
  return [
    { key: 'numero', label: tr('hse.formation.list.columns.numero'), field: 'numero', type: 'text', sortable: true, width: '130px' },
    { key: 'titre', label: tr('hse.formation.list.columns.titre'), field: 'titre', type: 'text', sortable: true },
    { key: 'dateDebut', label: tr('hse.formation.list.columns.dateDebut'), field: 'dateDebut', type: 'text', sortable: true, width: '120px', transform: fmtDate },
    {
      key: 'dureeHeures', label: tr('hse.formation.list.columns.duree'), field: 'dureeHeures', type: 'text', width: '80px',
      transform: (v) => v != null ? tr('hse.formation.list.transform.heuresSuffix').replace('{n}', String(v)) : '—',
    },
    { key: 'formateur', label: tr('hse.formation.list.columns.formateur'), field: 'formateur', type: 'text', sortable: true, transform: (v) => String(v ?? '—') },
    { key: 'nbParticipants', label: tr('hse.formation.list.columns.participants'), field: 'nbParticipants', type: 'number', sortable: true, width: '110px' },
    {
      key: 'status', label: tr('hse.formation.list.columns.statut'), field: 'status', type: 'badge', sortable: true, width: '120px',
      transform: (v) => translateOrEmpty(t, FORMATION_STATUS_KEYS[v as keyof typeof FORMATION_STATUS_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => STATUS_VARIANTS[String(v)] ?? 'default',
    },
  ];
}
