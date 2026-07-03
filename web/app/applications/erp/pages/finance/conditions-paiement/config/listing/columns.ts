import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { CONDITION_PAIEMENT_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';

function translateOrFallback(t: TranslateService, key: string, value: unknown): string {
  if (!key) return String(value ?? '');
  const resolved = t.instant(key);
  return resolved === key ? String(value ?? '') : resolved;
}

export function buildConditionPaiementColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const dash = tr('finance.common.dash');
  const defautLabel = tr('finance.conditionPaiement.list.columns.echeance');
  const actifLabel = tr('finance.conditionPaiement.list.columns.actif');

  return [
    {
      key: 'code',
      label: tr('finance.conditionPaiement.list.columns.code'),
      field: 'code',
      sortable: true,
      width: '130px',
    },
    {
      key: 'libelle',
      label: tr('finance.conditionPaiement.list.columns.libelle'),
      field: 'libelle',
      sortable: true,
    },
    {
      key: 'type',
      label: tr('finance.conditionPaiement.list.columns.type'),
      field: 'type',
      type: 'badge',
      sortable: true,
      width: '160px',
      badgeVariant: (v: unknown) => (v === 'ECHEANCES_MULTIPLES' ? 'warning' : 'info'),
      transform: (v: unknown) =>
        translateOrFallback(
          t,
          CONDITION_PAIEMENT_TYPE_KEYS[v as keyof typeof CONDITION_PAIEMENT_TYPE_KEYS] ?? '',
          v,
        ),
    },
    {
      key: 'delaiJours',
      label: tr('finance.conditionPaiement.list.columns.delaiJours'),
      field: 'delaiJours',
      type: 'text',
      width: '100px',
      transform: (v: unknown) =>
        typeof v === 'number'
          ? t.instant('finance.conditionPaiement.display.delai', { n: v })
          : dash,
    },
    {
      key: 'echeances',
      label: tr('finance.conditionPaiement.list.columns.echeance'),
      field: 'echeances',
      type: 'text',
      width: '100px',
      transform: (v: unknown) => {
        const len = Array.isArray(v) ? v.length : 0;
        return len > 0 ? String(len) : dash;
      },
    },
    {
      key: 'isDefaut',
      label: defautLabel,
      field: 'isDefaut',
      type: 'badge',
      width: '100px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? defautLabel : dash),
    },
    {
      key: 'isActive',
      label: actifLabel,
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) =>
        v ? tr('finance.common.labels.all') : tr('finance.common.labels.none'),
    },
  ];
}
