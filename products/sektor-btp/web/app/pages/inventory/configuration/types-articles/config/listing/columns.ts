import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const ARTICLE_TYPE_VARIANTS: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  MATERIAU: 'info',
  CONSOMMABLE: 'warning',
  ENGIN: 'success',
  OUTILLAGE: 'default',
};

export function buildTypeArticleColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.typeArticle.list.columns.code'),
      field: 'code',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.typeArticle.list.columns.name'),
      field: 'name',
      type: 'text',
      sortable: true,
    },
    {
      key: 'articleType',
      label: tr('inventory.configuration.typeArticle.list.columns.articleType'),
      field: 'articleType',
      type: 'badge',
      width: '130px',
      badgeVariant: (value: unknown) => ARTICLE_TYPE_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) => {
        const key = `inventory.enums.articleType.${String(value)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(value ?? '') : resolved;
      },
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.typeArticle.list.columns.isActive'),
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('inventory.common.active') : tr('inventory.common.inactive')),
    },
  ];
}
