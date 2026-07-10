import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildContratSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { id: 'identite', title: tr('achats.contrat.form.sections.identite'), icon: 'file-check', fields: ['numero', 'fournisseurId', 'type', 'objet'], columns: 2 },
    { id: 'periode', title: tr('achats.contrat.form.sections.periode'), icon: 'calendar', fields: ['dateDebut', 'dateFin', 'montantPlafondHt', 'cumulBcEmisHt', 'conditionsPaiement'], columns: 2 },
    { id: 'notes', title: tr('achats.contrat.form.sections.notes'), icon: 'edit', fields: ['notes'], columns: 1 },
  ];
}
