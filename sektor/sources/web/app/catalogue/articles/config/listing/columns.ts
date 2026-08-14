import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@platform/lib/anatomy/types';

const NATURE_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'info'> = {
  MATIERE: 'info',
  CONSOMMABLE: 'warning',
  CARBURANT: 'warning',
  OUTILLAGE: 'default',
  MATERIEL: 'success',
  LOCATION: 'success',
  MAIN_DOEUVRE: 'info',
  SOUS_TRAITANCE: 'default',
  SERVICE: 'default',
};

export function buildArticleColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.catalogue.article.list.columns.code'),
      field: 'code',
      type: 'text',
      sortable: true,
      width: '110px',
    },
    {
      key: 'name',
      label: tr('inventory.catalogue.article.list.columns.name'),
      field: 'name',
      type: 'text',
      sortable: true,
    },
    {
      key: 'familleName',
      label: tr('inventory.catalogue.article.list.columns.familleName'),
      field: 'familleName',
      type: 'text',
      sortable: true,
      width: '150px',
    },
    {
      key: 'lotsUsage',
      label: tr('inventory.catalogue.article.list.columns.lotsUsage'),
      field: 'lotsUsage',
      type: 'text',
      width: '180px',
      transform: (value: unknown) => {
        if (!Array.isArray(value) || value.length === 0) return '—';
        return value
          .map((code) => {
            const key = `inventory.enums.usageLot.${String(code)}`;
            const resolved = t.instant(key);
            return resolved === key ? String(code) : resolved;
          })
          .join(', ');
      },
    },
    {
      key: 'nature',
      label: tr('inventory.catalogue.article.list.columns.nature'),
      field: 'nature',
      type: 'badge',
      width: '140px',
      badgeVariant: (value: unknown) => NATURE_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) => {
        const key = `inventory.enums.nature.${String(value)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(value ?? '') : resolved;
      },
    },
    {
      key: 'uomCode',
      label: tr('inventory.catalogue.article.list.columns.uomCode'),
      field: 'uomCode',
      type: 'text',
      width: '80px',
    },
    {
      key: 'prixUnitaire',
      label: tr('inventory.catalogue.article.list.columns.prixUnitaire'),
      field: 'prixUnitaire',
      type: 'currency',
      sortable: true,
      width: '120px',
    },
    {
      key: 'pmp',
      label: tr('inventory.catalogue.article.list.columns.pmp'),
      field: 'pmp',
      type: 'currency',
      sortable: true,
      width: '110px',
    },
    {
      key: 'delaiReapproJours',
      label: tr('inventory.catalogue.article.list.columns.delaiReapproJours'),
      field: 'delaiReapproJours',
      type: 'number',
      sortable: true,
      width: '90px',
      transform: (v: unknown) => (v != null ? String(v) : '—'),
    },
    {
      key: 'posteBudgetId',
      label: tr('inventory.catalogue.article.list.columns.posteBudgetId'),
      field: 'posteBudgetId',
      type: 'text',
      width: '130px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'stockTotal',
      label: tr('inventory.catalogue.article.list.columns.stockTotal'),
      field: 'stockTotal',
      type: 'number',
      sortable: true,
      width: '100px',
    },
    {
      key: 'isActive',
      label: tr('inventory.catalogue.article.list.columns.isActive'),
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('inventory.common.active') : tr('inventory.common.inactive')),
    },
  ];
}
