import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildDemandeSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'entete',
      title: tr('achats.demande.form.sections.entete'),
      icon: 'shopping-cart',
      fields: ['numero', 'chantierId', 'dateBesoin', 'demandeurName', 'totalEstimeHt'],
      columns: 3,
    },
    {
      id: 'justification',
      title: tr('achats.demande.form.sections.justification'),
      icon: 'file-text',
      fields: ['motif', 'notes'],
      columns: 1,
    },
  ];
}
