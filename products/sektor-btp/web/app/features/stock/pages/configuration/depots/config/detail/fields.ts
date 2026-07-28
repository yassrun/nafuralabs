import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { LocationConfig } from '../../models';

export function buildDepotFields(t: TranslateService): DetailFieldConfig<LocationConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.depot.fields.code'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 24 }],
    },
    {
      key: 'name',
      label: tr('inventory.configuration.depot.fields.name'),
      type: 'text',
      required: true,
      width: 'lg',
      validators: [{ type: 'maxLength', value: 120 }],
    },
    {
      key: 'type',
      label: tr('inventory.configuration.depot.fields.type'),
      type: 'select',
      required: true,
      width: 'md',
      options: [
        { value: 'DEPOT', label: tr('inventory.enums.locationType.DEPOT') },
        { value: 'ENTREPOT', label: tr('inventory.enums.locationType.ENTREPOT') },
        { value: 'CHANTIER', label: tr('inventory.enums.locationType.CHANTIER') },
        { value: 'TRANSIT', label: tr('inventory.enums.locationType.TRANSIT') },
        { value: 'VIRTUEL', label: tr('inventory.enums.locationType.VIRTUEL') },
      ],
    },
    {
      key: 'projectRef',
      label: tr('inventory.configuration.depot.fields.projectRef'),
      type: 'text',
      width: 'md',
      validators: [{ type: 'maxLength', value: 50 }],
      visible: (v) => v?.type === 'CHANTIER',
    },
    {
      key: 'budgetChantierId',
      label: tr('inventory.configuration.depot.fields.budgetChantierId'),
      type: 'text',
      width: 'md',
      hint: tr('inventory.configuration.depot.fields.budgetChantierHint'),
      visible: (v) => v?.type === 'CHANTIER',
    },
    {
      key: 'address',
      label: tr('inventory.configuration.depot.fields.address'),
      type: 'textarea',
      width: 'full',
      validators: [{ type: 'maxLength', value: 500 }],
    },
    {
      key: 'ville',
      label: tr('inventory.configuration.depot.fields.ville'),
      type: 'text',
      width: 'md',
      validators: [{ type: 'maxLength', value: 80 }],
    },
    {
      key: 'latitude',
      label: tr('inventory.configuration.depot.fields.latitude'),
      type: 'number',
      width: 'sm',
      validators: [{ type: 'min', value: -90 }, { type: 'max', value: 90 }],
    },
    {
      key: 'longitude',
      label: tr('inventory.configuration.depot.fields.longitude'),
      type: 'number',
      width: 'sm',
      validators: [{ type: 'min', value: -180 }, { type: 'max', value: 180 }],
    },
    {
      key: 'capaciteM3',
      label: tr('inventory.configuration.depot.fields.capaciteM3'),
      type: 'number',
      width: 'sm',
      validators: [{ type: 'min', value: 0 }],
    },
    {
      key: 'capaciteTonnes',
      label: tr('inventory.configuration.depot.fields.capaciteTonnes'),
      type: 'number',
      width: 'sm',
      validators: [{ type: 'min', value: 0 }],
    },
    {
      key: 'responsableNom',
      label: tr('inventory.configuration.depot.fields.responsableNom'),
      type: 'text',
      width: 'md',
      validators: [{ type: 'maxLength', value: 120 }],
    },
    {
      key: 'notes',
      label: tr('inventory.configuration.depot.fields.notes'),
      type: 'textarea',
      width: 'full',
      validators: [{ type: 'maxLength', value: 2000 }],
    },
    {
      key: 'parentId',
      label: tr('inventory.configuration.depot.fields.parentId'),
      type: 'select',
      width: 'md',
      lookupKey: 'location',
      lookupDisplayField: 'name',
      lookupValueField: 'id',
      searchable: true,
      clearable: true,
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.depot.fields.isActive'),
      type: 'toggle',
      width: 'sm',
    },
  ];
}
