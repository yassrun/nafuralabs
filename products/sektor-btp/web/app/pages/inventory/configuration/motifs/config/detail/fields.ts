import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { MotifMouvementConfig } from '../../models';

export function buildMotifFields(t: TranslateService): DetailFieldConfig<MotifMouvementConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.motif.fields.code'),
      type: 'text',
      required: true,
      readonly: true,
      width: 'md',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.motif.fields.name'),
      type: 'text',
      required: true,
      readonly: true,
      width: 'lg',
    },
    {
      key: 'txType',
      label: tr('inventory.configuration.motif.fields.txType'),
      type: 'select',
      required: true,
      readonly: true,
      width: 'md',
      options: [
        { value: 'RECEPTION', label: tr('inventory.enums.txType.RECEPTION') },
        { value: 'TRANSFERT', label: tr('inventory.enums.txType.TRANSFERT') },
        { value: 'RETOUR', label: tr('inventory.enums.txType.RETOUR') },
        { value: 'INVENTAIRE', label: tr('inventory.enums.txType.INVENTAIRE') },
        { value: 'PERTE', label: tr('inventory.enums.txType.PERTE') },
        { value: 'SORTIE', label: tr('inventory.enums.txType.SORTIE') },
      ],
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.motif.fields.isActive'),
      type: 'toggle',
      readonly: true,
      width: 'sm',
    },
  ];
}
