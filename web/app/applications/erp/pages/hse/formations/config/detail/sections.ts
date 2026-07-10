import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildFormationSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { id: 'identification', title: tr('hse.formation.form.sections.identification'), fields: ['numero', 'titre', 'dateDebut', 'dateFin', 'dureeHeures'] },
    { id: 'details', title: tr('hse.formation.form.sections.details'), fields: ['formateur', 'lieu', 'nbParticipants', 'notes'] },
  ];
}
