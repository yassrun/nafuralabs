import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const ARTICLE_TYPE_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'info'> = {
  MATERIAU: 'info',
  CONSOMMABLE: 'warning',
  ENGIN: 'success',
  OUTILLAGE: 'default',
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
      key: 'articleType',
      label: tr('inventory.catalogue.article.list.columns.articleType'),
      field: 'articleType',
      type: 'badge',
      width: '120px',
      badgeVariant: (value: unknown) => ARTICLE_TYPE_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) => {
        const key = `inventory.enums.articleType.${String(value)}`;
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
