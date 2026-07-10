import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { Avoir } from '@applications/erp/ventes/models';

export function buildAvoirFields(t: TranslateService): DetailFieldConfig<Avoir>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'numero',
      label: tr('ventes.avoir.form.fields.numero'),
      type: 'text',
      readonly: true,
      width: 'md',
      placeholder: tr('ventes.avoir.form.fields.numeroPlaceholder'),
    },
    {
      key: 'factureOriginaleId',
      label: tr('ventes.avoir.form.fields.factureOrigine'),
      type: 'select',
      required: true,
      width: 'lg',
      lookupKey: 'factures',
      searchable: true,
    },
    {
      key: 'clientId',
      label: tr('ventes.avoir.form.fields.client'),
      type: 'select',
      required: true,
      width: 'lg',
      lookupKey: 'clients',
      searchable: true,
    },
    {
      key: 'dateEmission',
      label: tr('ventes.avoir.form.fields.dateEmission'),
      type: 'date',
      required: true,
      width: 'md',
    },
    {
      key: 'motif',
      label: tr('ventes.avoir.form.fields.motif'),
      type: 'textarea',
      required: true,
      width: 'full',
    },
    {
      key: 'totalHt',
      label: tr('ventes.avoir.form.fields.totalHt'),
      type: 'money-ma',
      required: true,
      width: 'md',
    },
    {
      key: 'tvaTaux',
      label: tr('ventes.avoir.form.fields.tvaTaux'),
      type: 'number',
      required: true,
      width: 'sm',
      defaultValue: 20,
    },
    {
      key: 'totalTva',
      label: tr('ventes.avoir.form.fields.tva'),
      type: 'money-ma',
      readonly: true,
      width: 'md',
    },
    {
      key: 'totalTtc',
      label: tr('ventes.avoir.form.fields.totalTtc'),
      type: 'money-ma',
      readonly: true,
      width: 'md',
    },
    {
      key: 'notes',
      label: tr('ventes.avoir.form.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lignes',
      label: tr('ventes.avoir.form.fields.lignes'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}
