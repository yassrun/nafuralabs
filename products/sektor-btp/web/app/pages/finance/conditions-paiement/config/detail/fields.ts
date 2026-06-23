import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { ConditionPaiement } from '@applications/erp/finance/models';

export function buildConditionPaiementFields(t: TranslateService): DetailFieldConfig<ConditionPaiement>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('finance.conditionPaiement.form.fields.code'),
      type: 'text',
      required: true,
      width: 'sm',
      validators: [{ type: 'maxLength', value: 30 }],
    },
    {
      key: 'libelle',
      label: tr('finance.conditionPaiement.form.fields.libelle'),
      type: 'text',
      required: true,
      width: 'lg',
      validators: [{ type: 'maxLength', value: 200 }],
    },
    {
      key: 'type',
      label: tr('finance.conditionPaiement.form.fields.type'),
      type: 'select',
      required: true,
      width: 'md',
      lookupKey: 'conditionPaiementType',
    },
    {
      key: 'delaiJours',
      label: tr('finance.conditionPaiement.form.fields.delaiJours'),
      type: 'number',
      width: 'sm',
      hint: tr('finance.conditionPaiement.subtitle'),
      validators: [{ type: 'min', value: 0 }, { type: 'max', value: 365 }],
    },
    {
      key: 'isDefaut',
      label: tr('finance.conditionPaiement.form.fields.echeance'),
      type: 'toggle',
      width: 'sm',
    },
    {
      key: 'isActive',
      label: tr('finance.conditionPaiement.form.fields.actif'),
      type: 'toggle',
      width: 'sm',
      defaultValue: true,
    },
    {
      key: 'notes',
      label: tr('finance.conditionPaiement.list.columns.libelle'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'echeances',
      label: tr('finance.conditionPaiement.list.columns.echeance'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}
