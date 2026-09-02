import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@platform/lib/anatomy/types';

export function buildConsultationFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'statut',
      label: tr('achats.consultation.list.filters.statut'),
      type: 'select',
      options: [
        { value: 'PREPARATION', label: tr('achats.consultation.statut.preparation') },
        { value: 'OUVERTE', label: tr('achats.consultation.statut.ouverte') },
        { value: 'PARTIELLE', label: tr('achats.consultation.statut.partielle') },
        { value: 'COMPLETE', label: tr('achats.consultation.statut.complete') },
      ],
    },
    {
      key: 'fournisseurId',
      label: tr('achats.consultation.list.filters.fournisseur'),
      type: 'select',
      lookupKey: 'fournisseurs',
      placeholder: tr('achats.consultation.destinataires.placeholder'),
    },
    {
      key: 'articleId',
      label: tr('achats.consultation.list.filters.article'),
      type: 'select',
      lookupKey: 'items',
      placeholder: tr('achats.consultation.list.filters.articlePlaceholder'),
    },
    {
      key: 'lien',
      label: tr('achats.consultation.list.filters.lien'),
      type: 'select',
      options: [
        { value: 'all', label: tr('achats.consultation.list.filters.lienAll') },
        { value: 'hors', label: tr('achats.consultation.list.filters.lienHors') },
        { value: 'liee', label: tr('achats.consultation.list.filters.lienLiee') },
      ],
    },
  ];
}
