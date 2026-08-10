import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { UomConfig } from '../../models';

export function buildUomFields(t: TranslateService): DetailFieldConfig<UomConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.uom.fields.code'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 10 }],
    },
    {
      key: 'name',
      label: tr('inventory.configuration.uom.fields.name'),
      type: 'text',
      required: true,
      width: 'lg',
      validators: [{ type: 'maxLength', value: 50 }],
    },
    {
      key: 'uomCategoryId',
      label: tr('inventory.configuration.uom.fields.uomCategoryId'),
      type: 'select',
      required: true,
      width: 'md',
      lookupKey: 'uomCategory',
      lookupDisplayField: 'name',
      lookupValueField: 'id',
      searchable: true,
      clearable: true,
      referenceRoute: '/inventory/configuration/uom-categories',
    },
    {
      key: 'facteurVersBase',
      label: tr('inventory.configuration.uom.fields.facteurVersBase'),
      type: 'number',
      required: true,
      width: 'md',
      hint: tr('inventory.configuration.uom.fields.facteurVersBaseHint'),
    },
    {
      key: 'estBase',
      label: tr('inventory.configuration.uom.fields.estBase'),
      type: 'toggle',
      width: 'sm',
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.uom.fields.isActive'),
      type: 'toggle',
      width: 'sm',
    },
  ];
}
