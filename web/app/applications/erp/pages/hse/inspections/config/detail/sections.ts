import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildInspectionSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identification',
      title: tr('hse.inspection.form.sections.identification'),
      icon: 'clipboard-check',
      fields: ['numero', 'dateInspection', 'chantierId', 'inspecteurNom', 'thematique'],
      columns: 3,
    },
    {
      id: 'resultats',
      title: tr('hse.inspection.form.sections.resultats'),
      icon: 'bar-chart',
      fields: ['nbObservations', 'nbNonConformites', 'noteGlobale', 'observations', 'notes'],
      columns: 2,
    },
  ];
}
