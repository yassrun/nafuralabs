import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { CostingMethodConfig } from '../../models';

export function buildCostingMethodFields(t: TranslateService): DetailFieldConfig<CostingMethodConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.costingMethod.fields.code'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 10 }],
    },
    {
      key: 'name',
      label: tr('inventory.configuration.costingMethod.fields.name'),
      type: 'text',
      required: true,
      width: 'lg',
      validators: [{ type: 'maxLength', value: 100 }],
    },
    {
      key: 'method',
      label: tr('inventory.configuration.costingMethod.fields.method'),
      type: 'select',
      required: true,
      width: 'md',
      options: [
        { value: 'AVCO', label: tr('inventory.enums.costingMethod.AVCO') },
        { value: 'FIFO', label: tr('inventory.enums.costingMethod.FIFO') },
        { value: 'STD', label: tr('inventory.enums.costingMethod.STD') },
      ],
    },
    {
      key: 'description',
      label: tr('inventory.configuration.costingMethod.fields.description'),
      type: 'textarea',
      width: 'full',
      validators: [{ type: 'maxLength', value: 500 }],
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.costingMethod.fields.isActive'),
      type: 'toggle',
      width: 'sm',
    },
    {
      key: 'isDefault',
      label: tr('inventory.configuration.costingMethod.fields.isDefault'),
      type: 'toggle',
      width: 'sm',
      hint: tr('inventory.configuration.costingMethod.fields.isDefaultHint'),
    },
  ];
}
