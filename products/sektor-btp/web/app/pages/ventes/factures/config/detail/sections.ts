import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { FactureClient } from '@applications/erp/ventes/models';

export function buildFactureSections(
  t: TranslateService,
): DetailSectionConfig<FactureClient>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identite',
      title: tr('ventes.facture.form.sections.identite'),
      icon: 'tag',
      fields: ['numero', 'type', 'clientId', 'chantierId', 'bcClientId', 'situationId'],
      columns: 2,
    },
    {
      id: 'dates',
      title: tr('ventes.facture.form.sections.dates'),
      icon: 'calendar',
      fields: ['dateEmission', 'dateEcheance', 'modePaiement'],
      columns: 3,
    },
    {
      id: 'lignes',
      title: tr('ventes.facture.form.sections.lignes'),
      icon: 'list',
      fields: ['lignes'],
      columns: 1,
    },
    {
      id: 'decompte',
      title: tr('ventes.facture.form.sections.decompte'),
      icon: 'calculator',
      fields: [
        'totalHt',
        'retenueGarantieTaux',
        'retenueGarantieMontant',
        'resorptionAvanceMontant',
        'marchePublic',
        'netAPayerHt',
        'tvaTaux',
        'totalTva',
        'retenueSourceMontantMad',
        'netAPayerTtc',
        'cumulEncaisseTtc',
        'resteTtc',
      ],
      columns: 3,
    },
    {
      id: 'encaissements',
      title: tr('ventes.facture.form.sections.encaissements'),
      icon: 'credit-card',
      fields: ['encaissements'],
      columns: 1,
    },
    {
      id: 'autres',
      title: tr('ventes.facture.form.sections.autres'),
      icon: 'file-text',
      fields: ['motifLitige', 'notes'],
      columns: 1,
    },
  ];
}
