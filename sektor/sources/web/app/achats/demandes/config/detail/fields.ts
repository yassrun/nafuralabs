import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@platform/lib/anatomy/types';

export function buildDemandeFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('achats.demande.form.fields.numero'), type: 'text', readonly: true },
    { key: 'chantierId', label: tr('achats.demande.form.fields.chantier'), type: 'select', lookupKey: 'chantiers', required: true },
    { key: 'noeudId', label: tr('achats.demande.form.fields.noeud'), type: 'text' },
    { key: 'dateBesoin', label: tr('achats.demande.form.fields.dateBesoin'), type: 'date', required: true },
    { key: 'demandeurName', label: tr('achats.demande.form.fields.demandeur'), type: 'text', readonly: true },
    { key: 'totalEstimeHt', label: tr('achats.demande.form.fields.totalEstimeHt'), type: 'money-ma', readonly: true },
    { key: 'motif', label: tr('achats.demande.form.fields.motif'), type: 'textarea' },
    { key: 'notes', label: tr('achats.demande.form.fields.notes'), type: 'textarea' },
  ];
}
