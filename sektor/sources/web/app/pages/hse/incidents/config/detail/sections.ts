import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildIncidentSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identification',
      title: tr('hse.incident.form.sections.identification'),
      icon: 'alert-triangle',
      fields: ['numero', 'date', 'heure', 'lieu', 'chantierId', 'typeIncident', 'gravite'],
      columns: 3,
    },
    {
      id: 'details',
      title: tr('hse.incident.form.sections.details'),
      icon: 'file-text',
      fields: ['description', 'victimeNom', 'cnssMatriculeVictime', 'joursArret', 'planAction'],
      columns: 2,
    },
    {
      id: 'actions',
      title: tr('hse.incident.form.sections.actions'),
      icon: 'check-circle',
      fields: ['causes', 'actionsImmedites', 'notes'],
      columns: 1,
    },
  ];
}
