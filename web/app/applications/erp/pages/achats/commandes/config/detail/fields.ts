import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildBcFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('achats.commande.form.fields.numero'), type: 'text', readonly: true },
    { key: 'fournisseurId', label: tr('achats.commande.form.fields.fournisseur'), type: 'select', lookupKey: 'fournisseurs', required: true },
    { key: 'chantierId', label: tr('achats.commande.form.fields.chantier'), type: 'select', lookupKey: 'chantiers' },
    {
      key: 'rubrique', label: tr('achats.commande.form.fields.rubrique'), type: 'select', required: true,
      options: [
        { value: 'MATERIAUX', label: tr('achats.rubrique.MATERIAUX') },
        { value: 'SOUS_TRAITANCE', label: tr('achats.rubrique.SOUS_TRAITANCE') },
        { value: 'LOCATION_MATERIEL', label: tr('achats.rubrique.LOCATION_MATERIEL') },
        { value: 'CARBURANT', label: tr('achats.rubrique.CARBURANT') },
        { value: 'FRAIS_GENERAUX', label: tr('achats.rubrique.FRAIS_GENERAUX') },
      ],
    },
    { key: 'dateCreation', label: tr('achats.commande.form.fields.dateCreation'), type: 'date', required: true },
    { key: 'dateLivraisonPrevue', label: tr('achats.commande.form.fields.dateLivraisonPrevue'), type: 'date', required: true },
    { key: 'conditionsPaiement', label: tr('achats.commande.form.fields.conditionsPaiement'), type: 'text' },
    {
      key: 'modeReglement', label: tr('achats.commande.form.fields.modeReglement'), type: 'select',
      options: [
        { value: 'VIREMENT', label: tr('achats.modeReglement.VIREMENT') },
        { value: 'CHEQUE', label: tr('achats.modeReglement.CHEQUE') },
        { value: 'EFFET', label: tr('achats.modeReglement.EFFET') },
        { value: 'ESPECES', label: tr('achats.modeReglement.ESPECES') },
      ],
    },
    { key: 'totalHt', label: tr('achats.commande.form.fields.totalHt'), type: 'money-ma', readonly: true },
    { key: 'tvaTaux', label: tr('achats.commande.form.fields.tvaTaux'), type: 'number', defaultValue: 20 },
    { key: 'totalTtc', label: tr('achats.commande.form.fields.totalTtc'), type: 'money-ma', readonly: true },
    { key: 'notes', label: tr('achats.commande.form.fields.notes'), type: 'textarea' },
  ];
}
