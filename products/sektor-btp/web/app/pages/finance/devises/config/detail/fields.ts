import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { Devise } from '@applications/erp/finance/models';

export function buildDeviseFields(t: TranslateService): DetailFieldConfig<Devise>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('finance.devise.form.fields.codeIso'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'sm',
      hint: tr('finance.devise.form.hints.codeIso'),
      validators: [
        { type: 'minLength', value: 3 },
        { type: 'maxLength', value: 3 },
        { type: 'pattern', pattern: '^[A-Z]{3}$' },
      ],
    },
    {
      key: 'libelle',
      label: tr('finance.devise.form.fields.libelle'),
      type: 'text',
      required: true,
      width: 'lg',
    },
    {
      key: 'symbole',
      label: tr('finance.devise.form.fields.symbole'),
      type: 'text',
      required: true,
      width: 'sm',
      validators: [{ type: 'maxLength', value: 6 }],
    },
    {
      key: 'precisionDecimales',
      label: tr('finance.devise.form.fields.precision'),
      type: 'number',
      required: true,
      width: 'sm',
      defaultValue: 2,
      validators: [
        { type: 'min', value: 0 },
        { type: 'max', value: 6 },
      ],
    },
    {
      key: 'isDeviseDeReference',
      label: tr('finance.devise.form.fields.reference'),
      type: 'toggle',
      width: 'sm',
      hint: tr('finance.devise.form.hints.reference'),
    },
    {
      key: 'isActive',
      label: tr('finance.devise.form.fields.actif'),
      type: 'toggle',
      width: 'sm',
      defaultValue: true,
    },
  ];
}
