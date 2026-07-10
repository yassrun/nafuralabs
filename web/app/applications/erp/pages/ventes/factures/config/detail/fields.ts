import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { FactureClient } from '@applications/erp/ventes/models';
import {
  FACTURE_TYPE_KEYS,
} from '@applications/erp/shell/i18n-labels';

const PAIEMENT_MODES = [
  { value: 'VIREMENT', key: 'ventes.modePaiement.virement' },
  { value: 'CHEQUE', key: 'ventes.modePaiement.cheque' },
  { value: 'EFFET', key: 'ventes.modePaiement.effet' },
  { value: 'ESPECES', key: 'ventes.modePaiement.especes' },
  { value: 'COMPENSATION', key: 'ventes.modePaiement.compensation' },
] as const;

export function buildFactureFields(
  t: TranslateService,
): DetailFieldConfig<FactureClient>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'numero',
      label: tr('ventes.facture.form.fields.numero'),
      type: 'text',
      readonly: true,
      width: 'md',
      placeholder: tr('ventes.facture.form.fields.numeroPlaceholder'),
    },
    {
      key: 'type',
      label: tr('ventes.facture.form.fields.type'),
      type: 'select',
      required: true,
      width: 'md',
      options: (Object.keys(FACTURE_TYPE_KEYS) as Array<keyof typeof FACTURE_TYPE_KEYS>).map(
        (value) => ({ value, label: tr(FACTURE_TYPE_KEYS[value]) }),
      ),
      defaultValue: 'SITUATION',
    },
    {
      key: 'clientId',
      label: tr('ventes.facture.form.fields.client'),
      type: 'select',
      required: true,
      width: 'lg',
      lookupKey: 'clients',
      searchable: true,
    },
    {
      key: 'chantierId',
      label: tr('ventes.facture.form.fields.chantier'),
      type: 'select',
      width: 'lg',
      lookupKey: 'chantiers',
      searchable: true,
      clearable: true,
    },
    {
      key: 'bcClientId',
      label: tr('ventes.facture.form.fields.bcClient'),
      type: 'text',
      width: 'md',
    },
    {
      key: 'situationId',
      label: tr('ventes.facture.form.fields.situationSource'),
      type: 'text',
      width: 'md',
    },
    {
      key: 'dateEmission',
      label: tr('ventes.facture.form.fields.dateEmission'),
      type: 'date',
      required: true,
      width: 'md',
    },
    {
      key: 'dateEcheance',
      label: tr('ventes.facture.form.fields.dateEcheance'),
      type: 'date',
      required: true,
      width: 'md',
    },
    {
      key: 'modePaiement',
      label: tr('ventes.facture.form.fields.modePaiement'),
      type: 'select',
      width: 'md',
      options: PAIEMENT_MODES.map((m) => ({ value: m.value, label: tr(m.key) })),
      clearable: true,
    },
    {
      key: 'totalHt',
      label: tr('ventes.facture.form.fields.totalHt'),
      type: 'money-ma',
      required: true,
      width: 'md',
    },
    {
      key: 'retenueGarantieTaux',
      label: tr('ventes.facture.form.fields.retenueGarantie') + ' (%)',
      type: 'number',
      width: 'sm',
      readonly: true,
    },
    {
      key: 'retenueGarantieMontant',
      label: tr('ventes.facture.form.fields.retenueGarantie'),
      type: 'money-ma',
      width: 'md',
      defaultValue: 0,
    },
    {
      key: 'resorptionAvanceMontant',
      label: tr('ventes.facture.form.fields.resorptionAvance'),
      type: 'money-ma',
      width: 'md',
    },
    {
      key: 'marchePublic',
      label: 'Marché public (RAS)',
      type: 'checkbox',
      width: 'md',
      defaultValue: false,
    },
    {
      key: 'tvaTaux',
      label: tr('ventes.facture.form.fields.tvaTaux'),
      type: 'number',
      required: true,
      width: 'sm',
      defaultValue: 20,
    },
    {
      key: 'netAPayerHt',
      label: tr('ventes.facture.form.fields.netHt'),
      type: 'money-ma',
      readonly: true,
      width: 'md',
    },
    {
      key: 'totalTva',
      label: tr('ventes.facture.form.fields.tva'),
      type: 'money-ma',
      readonly: true,
      width: 'md',
    },
    {
      key: 'retenueSourceMontantMad',
      label: 'Retenue source (MAD)',
      type: 'money-ma',
      readonly: true,
      width: 'md',
      visible: (form) => !!form.marchePublic || (form.retenueSourceMontantMad ?? 0) > 0,
    },
    {
      key: 'netAPayerTtc',
      label: tr('ventes.facture.form.fields.netTtc'),
      type: 'money-ma',
      readonly: true,
      width: 'md',
    },
    {
      key: 'cumulEncaisseTtc',
      label: tr('ventes.facture.form.fields.cumulEncaisse'),
      type: 'money-ma',
      readonly: true,
      width: 'md',
    },
    {
      key: 'resteTtc',
      label: tr('ventes.facture.form.fields.resteEncaisser'),
      type: 'money-ma',
      readonly: true,
      width: 'md',
    },
    {
      key: 'motifLitige',
      label: tr('ventes.facture.form.fields.motifLitige'),
      type: 'textarea',
      width: 'full',
      visible: (form) => form.status === 'EN_LITIGE',
    },
    {
      key: 'notes',
      label: tr('ventes.facture.form.fields.notes'),
      type: 'textarea',
      width: 'full',
    },
    {
      key: 'lignes',
      label: tr('ventes.facture.form.fields.lignes'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
    {
      key: 'encaissements',
      label: tr('ventes.facture.form.fields.encaissements'),
      type: 'custom',
      width: 'full',
      defaultValue: [],
    },
  ];
}
