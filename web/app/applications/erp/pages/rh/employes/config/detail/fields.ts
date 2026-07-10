import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildEmployeFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'nom', label: tr('rh.employe.fieldsRequired.nom'), type: 'text', required: true },
    { key: 'prenom', label: tr('rh.employe.fieldsRequired.prenom'), type: 'text', required: true },
    { key: 'cin', label: tr('rh.employe.fieldsRequired.cin'), type: 'text', required: true },
    { key: 'cnss', label: tr('rh.employe.fields.cnss'), type: 'text' },
    { key: 'dateNaissance', label: tr('rh.employe.fields.dateNaissance'), type: 'date' },
    { key: 'telephone', label: tr('rh.employe.fields.telephone'), type: 'phone-ma' },
    { key: 'email', label: tr('rh.employe.fields.email'), type: 'text' },
    { key: 'adresse', label: tr('rh.employe.fields.adresse'), type: 'text' },
    { key: 'ville', label: tr('rh.employe.fields.ville'), type: 'text' },
    { key: 'matricule', label: tr('rh.employe.fields.matricule'), type: 'text', readonly: true },
    {
      key: 'typeContrat', label: tr('rh.employe.fieldsRequired.typeContrat'), type: 'select', required: true,
      options: [
        { value: 'CDI', label: tr('rh.employe.types.CDI') },
        { value: 'CDD', label: tr('rh.employe.types.CDD') },
        { value: 'ANAPEC', label: tr('rh.employe.types.ANAPEC') },
        { value: 'Saisonnier', label: tr('rh.employe.types.Saisonnier') },
        { value: 'Interim', label: tr('rh.employe.types.Interim') },
      ],
    },
    {
      key: 'categorie', label: tr('rh.employe.fieldsRequired.categorie'), type: 'select', required: true,
      options: [
        { value: 'Ouvrier', label: tr('rh.employe.categories.Ouvrier') },
        { value: 'Agent_maitrise', label: tr('rh.employe.categories.Agent_maitrise') },
        { value: 'Cadre', label: tr('rh.employe.categories.Cadre') },
        { value: 'Direction', label: tr('rh.employe.categories.Direction') },
      ],
    },
    { key: 'poste', label: tr('rh.employe.fieldsRequired.poste'), type: 'text', required: true },
    { key: 'departement', label: tr('rh.employe.fields.departement'), type: 'text' },
    { key: 'dateEmbauche', label: tr('rh.employe.fieldsRequired.dateEmbauche'), type: 'date', required: true },
    { key: 'dateFinContrat', label: tr('rh.employe.fields.dateFinContrat'), type: 'date' },
    {
      key: 'statut', label: tr('rh.employe.fields.statut'), type: 'select',
      options: [
        { value: 'ACTIF', label: tr('rh.employe.statuses.ACTIF') },
        { value: 'SUSPENDU', label: tr('rh.employe.statuses.SUSPENDU') },
        { value: 'SOLDE', label: tr('rh.employe.statuses.SOLDE') },
      ],
    },
    { key: 'salaireBase', label: tr('rh.employe.fieldsRequired.salaireBase'), type: 'money-ma', required: true },
    { key: 'indemniteRepresentation', label: tr('rh.employe.fields.indemniteRepresentation'), type: 'money-ma' },
    { key: 'indemniteTransport', label: tr('rh.employe.fields.indemniteTransport'), type: 'money-ma' },
    { key: 'banque', label: tr('rh.employe.fields.banque'), type: 'text' },
    { key: 'rib', label: tr('rh.employe.fields.rib'), type: 'rib', hint: tr('rh.employe.fields.ribHint') },
    { key: 'ice', label: tr('rh.employe.fields.ice'), type: 'ice' },
    { key: 'ifFiscal', label: tr('rh.employe.fields.ifFiscal'), type: 'text' },
    { key: 'rc', label: tr('rh.employe.fields.rc'), type: 'text' },
    { key: 'patente', label: tr('rh.employe.fields.patente'), type: 'text' },
    { key: 'notes', label: tr('rh.employe.fields.notes'), type: 'textarea' },
  ];
}
