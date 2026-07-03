import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildPaieSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'elements',
      title: tr('rh.paie.sections.elements'),
      icon: 'banknote',
      fields: ['numero', 'employeId', 'mois', 'salaireBase', 'indemniteRepresentation', 'indemniteTransport', 'montantHeuresSup', 'notes'],
      columns: 3,
    },
    {
      id: 'resultat',
      title: tr('rh.paie.sections.resultat'),
      icon: 'calculator',
      fields: ['salaireBrut', 'cotisationCNSS', 'cotisationAMO', 'totalRetenues', 'salaireNetImposable', 'igr', 'salaireNetAPayer'],
      columns: 3,
    },
  ];
}
