import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildCongeSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'demande',
      title: tr('rh.conge.sections.demande'),
      icon: 'calendar-off',
      fields: ['numero', 'employeId', 'type', 'dateDebut', 'dateFin', 'nombreJours', 'motif', 'notes'],
      columns: 3,
    },
    {
      id: 'traitement',
      title: tr('rh.conge.sections.traitement'),
      icon: 'check-circle',
      fields: ['motifRefus'],
      columns: 1,
    },
  ];
}
