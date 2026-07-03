import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../../../inventory/models';

export function buildReceptionDetailFields(t: TranslateService): DetailFieldConfig<InventoryTx>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'txNumber',
      label: tr('inventory.mouvement.reception.fields.txNumber'),
      type: 'text',
      readonly: true,
      width: 'md',
      defaultValue: '',
      placeholder: tr('inventory.mouvement.reception.fields.txNumberPlaceholder'),
    },
    {
      key: 'status',
      label: tr('inventory.mouvement.reception.fields.status'),
      type: 'custom',
      readonly: true,
      width: 'sm',
      defaultValue: 'BROUILLON',
    },
    {
      key: 'txDate',
      label: tr('inventory.mouvement.reception.fields.txDate'),
      type: 'date',
      required: true,
      width: 'md',
    },
    {
      key: 'fournisseurId',
      label: tr('inventory.mouvement.reception.fields.fournisseurId'),
      type: 'select',
      required: true,
      lookupKey: 'fournisseursLookup',
      searchable: true,
      width: 'full',
    },
    {
      key: 'destLocationId',
      label: tr('inventory.mouvement.reception.fields.destLocationId'),
      type: 'custom',
      width: 'full',
      defaultValue: null,
    },
    {
      key: 'chantierLocationId',
      label: tr('inventory.mouvement.reception.fields.chantierLocationId'),
      type: 'custom',
      width: 'md',
      defaultValue: null,
    },
    {
      key: 'phaseRef',
      label: tr('inventory.mouvement.reception.fields.phaseRef'),
      type: 'custom',
      width: 'md',
      defaultValue: '',
    },
    {
      key: 'reference',
      label: tr('inventory.mouvement.reception.fields.reference'),
      type: 'text',
      width: 'full',
    },
    {
      key: 'notes',
      label: tr('inventory.mouvement.reception.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lines',
      label: tr('inventory.mouvement.reception.fields.lines'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}
