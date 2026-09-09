import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@platform/lib/anatomy/types';

export function buildConsultationSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'panier',
      title: tr('achats.consultation.form.sections.panier'),
      icon: 'package',
      fields: ['panier'],
      columns: 1,
    },
  ];
}
