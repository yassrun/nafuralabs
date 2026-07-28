import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { FamilleArticleConfig } from '../../models';

export function buildFamilleFields(t: TranslateService): DetailFieldConfig<FamilleArticleConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.famille.fields.code'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 30 }],
    },
    {
      key: 'name',
      label: tr('inventory.configuration.famille.fields.name'),
      type: 'text',
      required: true,
      width: 'lg',
      validators: [{ type: 'maxLength', value: 100 }],
    },
    {
      key: 'description',
      label: tr('inventory.configuration.famille.fields.description'),
      type: 'textarea',
      width: 'full',
      validators: [{ type: 'maxLength', value: 500 }],
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.famille.fields.isActive'),
      type: 'toggle',
      width: 'sm',
    },
  ];
}
