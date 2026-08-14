import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { NATURES, USAGE_LOTS } from '@app/inventory/models';

export function buildArticleFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'familleId',
      label: tr('inventory.catalogue.article.list.filters.famille'),
      type: 'select',
      lookupKey: 'familleArticle',
    },
    {
      key: 'usageLot',
      label: tr('inventory.catalogue.article.list.filters.usageLot'),
      type: 'select',
      options: USAGE_LOTS.map((code) => ({
        value: code,
        label: tr(`inventory.enums.usageLot.${code}`),
      })),
    },
    {
      key: 'nature',
      label: tr('inventory.catalogue.article.list.filters.nature'),
      type: 'select',
      options: NATURES.map((code) => ({
        value: code,
        label: tr(`inventory.enums.nature.${code}`),
      })),
    },
    {
      key: 'isActive',
      label: tr('inventory.catalogue.article.list.filters.isActive'),
      type: 'select',
      options: [
        { value: true, label: tr('inventory.common.active') },
        { value: false, label: tr('inventory.common.inactive') },
      ],
    },
  ];
}
