import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

const CATEGORIES_OPTIONS = [
  'Aciers', 'Ronds à béton', 'Ciment', 'Cimentiers', 'Coffrage', 'Matériaux',
  'Agrégats', 'Granulats', 'Sable', 'Location matériel', 'Engins BTP',
  'Isolation', 'Étanchéité', 'Électricité', 'Câbles', 'Carrelage', 'Faïence',
  'Finitions', 'Carburant', 'Lubrifiants', 'Menuiserie', 'Bois',
  'Plomberie', 'Sanitaire', 'Peinture', 'Enduit', 'Services BTP', 'Adjuvants',
].map((c) => ({ value: c, label: c }));

export function buildFournisseurFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'code', label: tr('achats.fournisseur.form.fields.code'), type: 'text', readonly: true },
    { key: 'raisonSociale', label: tr('achats.fournisseur.form.fields.raisonSociale'), type: 'text', required: true },
    { key: 'ice', label: tr('achats.fournisseur.form.fields.ice'), type: 'ice', hint: tr('achats.fournisseur.form.fields.iceHint') },
    { key: 'rc', label: tr('achats.fournisseur.form.fields.rc'), type: 'text' },
    { key: 'patente', label: tr('achats.fournisseur.form.fields.patente'), type: 'text' },
    { key: 'adresse', label: tr('achats.fournisseur.form.fields.adresse'), type: 'text' },
    { key: 'ville', label: tr('achats.fournisseur.form.fields.ville'), type: 'text' },
    { key: 'pays', label: tr('achats.fournisseur.form.fields.pays'), type: 'text', defaultValue: 'MA' },
    { key: 'contactPrincipalNom', label: tr('achats.fournisseur.form.fields.contactNom'), type: 'text' },
    { key: 'contactPrincipalTel', label: tr('achats.fournisseur.form.fields.contactTel'), type: 'phone-ma' },
    { key: 'contactPrincipalEmail', label: tr('achats.fournisseur.form.fields.contactEmail'), type: 'text' },
    {
      key: 'conditionsPaiementParDefaut', label: tr('achats.fournisseur.form.fields.conditionsPaiement'), type: 'text',
      defaultValue: tr('achats.fournisseur.form.fields.conditionsPaiementDefault'),
    },
    {
      key: 'modeReglementParDefaut', label: tr('achats.fournisseur.form.fields.modeReglement'), type: 'select',
      options: [
        { value: 'VIREMENT', label: tr('achats.modeReglementLong.VIREMENT') },
        { value: 'CHEQUE', label: tr('achats.modeReglementLong.CHEQUE') },
        { value: 'EFFET', label: tr('achats.modeReglementLong.EFFET') },
        { value: 'ESPECES', label: tr('achats.modeReglementLong.ESPECES') },
      ],
    },
    { key: 'delaiLivraisonMoyen', label: tr('achats.fournisseur.form.fields.delaiLivraisonMoyen'), type: 'number' },
    { key: 'rib', label: tr('achats.fournisseur.form.fields.rib'), type: 'rib', hint: tr('achats.fournisseur.form.fields.ribHint') },
    { key: 'banque', label: tr('achats.fournisseur.form.fields.banque'), type: 'text' },
    {
      key: 'categories', label: tr('achats.fournisseur.form.fields.categories'), type: 'multi-select',
      options: CATEGORIES_OPTIONS,
    },
    {
      key: 'notation', label: tr('achats.fournisseur.form.fields.notation'), type: 'select',
      options: [
        { value: '1', label: tr('achats.fournisseur.form.notationOptions.one') },
        { value: '2', label: tr('achats.fournisseur.form.notationOptions.two') },
        { value: '3', label: tr('achats.fournisseur.form.notationOptions.three') },
        { value: '4', label: tr('achats.fournisseur.form.notationOptions.four') },
        { value: '5', label: tr('achats.fournisseur.form.notationOptions.five') },
      ],
    },
    { key: 'isActive', label: tr('achats.fournisseur.form.fields.isActive'), type: 'toggle', defaultValue: true },
    { key: 'notes', label: tr('achats.fournisseur.form.fields.notes'), type: 'textarea' },
  ];
}
