import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { TypeArticleConfig } from '../../models';

export function buildTypeArticleFields(t: TranslateService): DetailFieldConfig<TypeArticleConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.typeArticle.fields.code'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 30 }],
    },
    {
      key: 'name',
      label: tr('inventory.configuration.typeArticle.fields.name'),
      type: 'text',
      required: true,
      width: 'lg',
      validators: [{ type: 'maxLength', value: 100 }],
    },
    {
      key: 'articleType',
      label: tr('inventory.configuration.typeArticle.fields.articleType'),
      type: 'select',
      required: true,
      width: 'md',
      options: [
        { value: 'MATERIAU', label: tr('inventory.enums.articleType.MATERIAU') },
        { value: 'CONSOMMABLE', label: tr('inventory.enums.articleType.CONSOMMABLE') },
        { value: 'ENGIN', label: tr('inventory.enums.articleType.ENGIN') },
        { value: 'OUTILLAGE', label: tr('inventory.enums.articleType.OUTILLAGE') },
      ],
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.typeArticle.fields.isActive'),
      type: 'toggle',
      width: 'sm',
    },
  ];
}
