import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildNcSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identification',
      title: tr('hse.nonConformite.form.sections.identification'),
      icon: 'shield-x',
      fields: ['numero', 'date', 'type', 'chantierId', 'zoneChantier', 'sourceInspectionNumero'],
      columns: 2,
    },
    {
      id: 'details',
      title: tr('hse.nonConformite.form.sections.details'),
      icon: 'file-text',
      fields: ['description', 'causesRacines'],
      columns: 1,
    },
    {
      id: 'capa',
      title: tr('hse.nonConformite.form.sections.capa'),
      icon: 'check-circle',
      fields: ['actionCorrective', 'actionPreventive', 'responsableNom', 'dateEcheance', 'verificationEfficacite', 'dateVerificationEfficacite', 'notes'],
      columns: 2,
    },
  ];
}
