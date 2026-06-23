import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildAoSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'entete',
      title: tr('achats.appelOffre.form.sections.entete'),
      icon: 'clipboard-list',
      fields: ['numero', 'objet', 'chantierId', 'datePublication', 'dateLimiteDepot'],
      columns: 2,
    },
    {
      id: 'attribution',
      title: tr('achats.appelOffre.form.sections.attribution'),
      icon: 'award',
      fields: ['fournisseurAttribueName', 'totalAttribueHt'],
      columns: 2,
    },
    {
      id: 'notes',
      title: tr('achats.appelOffre.form.sections.notes'),
      icon: 'edit',
      fields: ['notes'],
      columns: 1,
    },
  ];
}
