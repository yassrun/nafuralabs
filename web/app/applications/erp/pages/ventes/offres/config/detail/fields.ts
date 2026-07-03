import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildOffreFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('ventes.offre.form.fields.numero'), type: 'text', readonly: true },
    {
      key: 'clientId',
      label: tr('ventes.offre.form.fields.client'),
      type: 'select',
      lookupKey: 'clients',
      required: true,
    },
    {
      key: 'chantierId',
      label: tr('ventes.offre.form.fields.chantier'),
      type: 'select',
      lookupKey: 'chantiers',
    },
    {
      key: 'dateEmission',
      label: tr('ventes.offre.form.fields.dateEmission'),
      type: 'date',
      required: true,
    },
    {
      key: 'dateValidite',
      label: tr('ventes.offre.form.fields.dateValidite'),
      type: 'date',
      required: true,
    },
    { key: 'objet', label: tr('ventes.offre.form.fields.objet'), type: 'text', required: true },
    { key: 'tvaTaux', label: tr('ventes.offre.form.fields.tvaTaux'), type: 'number' },
    { key: 'notes', label: tr('ventes.offre.form.fields.notes'), type: 'textarea' },
  ];
}
