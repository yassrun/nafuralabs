import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@platform/lib/anatomy/types';

export function buildConsultationFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'numero',
      label: tr('achats.consultation.form.fields.numero'),
      type: 'text',
      readonly: true,
    },
    {
      key: 'statutLabel',
      label: tr('achats.consultation.form.fields.statut'),
      type: 'text',
      readonly: true,
    },
    {
      key: 'lienEtude',
      label: tr('achats.consultation.form.fields.lien'),
      type: 'text',
      readonly: true,
    },
    {
      key: 'panier',
      label: tr('achats.consultation.form.fields.panier'),
      type: 'custom',
      width: 'full',
      readonly: true,
    },
  ];
}
