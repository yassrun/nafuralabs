import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@platform/lib/anatomy/types';

export function buildConsultationFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
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
