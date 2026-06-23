import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { TauxChange } from '@applications/erp/finance/models';

export function buildTauxChangeFields(t: TranslateService): DetailFieldConfig<TauxChange>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'deviseDeCode',
      label: tr('finance.tauxChange.form.fields.deviseBase'),
      type: 'select',
      required: true,
      width: 'sm',
      lookupKey: 'deviseCode',
    },
    {
      key: 'deviseVersCode',
      label: tr('finance.tauxChange.form.fields.deviseCible'),
      type: 'select',
      required: true,
      width: 'sm',
      lookupKey: 'deviseCode',
      defaultValue: 'MAD',
    },
    {
      key: 'dateValidite',
      label: tr('finance.tauxChange.form.fields.dateCotation'),
      type: 'date',
      required: true,
      width: 'md',
    },
    {
      key: 'taux',
      label: tr('finance.tauxChange.form.fields.taux'),
      type: 'number',
      required: true,
      width: 'md',
      validators: [{ type: 'min', value: 0.0001 }],
    },
    {
      key: 'source',
      label: tr('finance.tauxChange.form.fields.source'),
      type: 'select',
      width: 'sm',
      lookupKey: 'tauxChangeSource',
      defaultValue: 'MANUEL',
    },
    {
      key: 'isActive',
      label: tr('finance.tauxChange.list.columns.actions'),
      type: 'toggle',
      width: 'sm',
      defaultValue: true,
    },
  ];
}
