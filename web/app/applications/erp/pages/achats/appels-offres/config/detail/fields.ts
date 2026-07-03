import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildAoFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('achats.appelOffre.form.fields.numero'), type: 'text', readonly: true },
    { key: 'objet', label: tr('achats.appelOffre.form.fields.objet'), type: 'text', required: true },
    { key: 'chantierId', label: tr('achats.appelOffre.form.fields.chantier'), type: 'select', lookupKey: 'chantiers' },
    { key: 'datePublication', label: tr('achats.appelOffre.form.fields.datePublication'), type: 'date' },
    { key: 'dateLimiteDepot', label: tr('achats.appelOffre.form.fields.dateLimiteDepot'), type: 'date', required: true },
    { key: 'fournisseurAttribueName', label: tr('achats.appelOffre.form.fields.fournisseurAttribue'), type: 'text', readonly: true },
    { key: 'totalAttribueHt', label: tr('achats.appelOffre.form.fields.totalAttribueHt'), type: 'money-ma', readonly: true },
    { key: 'notes', label: tr('achats.appelOffre.form.fields.notes'), type: 'textarea' },
  ];
}
