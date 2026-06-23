import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { UomCategoryConfig } from '../../models';

export function buildUomCategoryFields(t: TranslateService): DetailFieldConfig<UomCategoryConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.uomCategory.fields.code'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 20 }],
    },
    {
      key: 'name',
      label: tr('inventory.configuration.uomCategory.fields.name'),
      type: 'text',
      required: true,
      width: 'lg',
      validators: [{ type: 'maxLength', value: 50 }],
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
      label: tr('inventory.configuration.uomCategory.fields.isActive'),
      type: 'toggle',
      width: 'sm',
    },
  ];
}
