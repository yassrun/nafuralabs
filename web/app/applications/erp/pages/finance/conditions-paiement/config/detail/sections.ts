import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { ConditionPaiement } from '@applications/erp/finance/models';

export function buildConditionPaiementSections(t: TranslateService): DetailSectionConfig<ConditionPaiement>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identite',
      title: tr('finance.factureFournisseur.sections.identite'),
      icon: 'tag',
      fields: ['code', 'libelle', 'type', 'isDefaut', 'isActive'],
      columns: 2,
    },
    {
      id: 'parametres',
      title: tr('finance.conditionPaiement.form.fields.delaiJours'),
      icon: 'sliders',
      fields: ['delaiJours', 'notes'],
      columns: 2,
    },
    {
      id: 'echeances',
      title: tr('finance.conditionPaiement.list.columns.echeance'),
      icon: 'list-checks',
      fields: ['echeances'],
      columns: 1,
    },
  ];
}
