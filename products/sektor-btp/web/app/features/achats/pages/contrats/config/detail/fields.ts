import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildContratFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('achats.contrat.form.fields.numero'), type: 'text', readonly: true },
    { key: 'fournisseurId', label: tr('achats.contrat.form.fields.fournisseur'), type: 'select', lookupKey: 'fournisseurs', required: true },
    {
      key: 'type', label: tr('achats.contrat.form.fields.type'), type: 'select', required: true,
      options: [
        { value: 'CADRE', label: tr('achats.contratType.CADRE') },
        { value: 'ANNUEL', label: tr('achats.contratType.ANNUEL') },
        { value: 'PONCTUEL', label: tr('achats.contratType.PONCTUEL') },
      ],
    },
    { key: 'objet', label: tr('achats.contrat.form.fields.objet'), type: 'text', required: true },
    { key: 'dateDebut', label: tr('achats.contrat.form.fields.dateDebut'), type: 'date', required: true },
    { key: 'dateFin', label: tr('achats.contrat.form.fields.dateFin'), type: 'date', required: true },
    { key: 'montantPlafondHt', label: tr('achats.contrat.form.fields.montantPlafondHt'), type: 'money-ma' },
    { key: 'cumulBcEmisHt', label: tr('achats.contrat.form.fields.cumulBcEmisHt'), type: 'money-ma', readonly: true },
    { key: 'conditionsPaiement', label: tr('achats.contrat.form.fields.conditionsPaiement'), type: 'text' },
    { key: 'notes', label: tr('achats.contrat.form.fields.notes'), type: 'textarea' },
  ];
}
