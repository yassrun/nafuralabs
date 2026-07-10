import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Avoir } from '@applications/erp/ventes/models';

export function buildAvoirSections(
  t: TranslateService,
): DetailSectionConfig<Avoir>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identite',
      title: tr('ventes.avoir.form.sections.identite'),
      icon: 'tag',
      fields: ['numero', 'factureOriginaleId', 'clientId', 'dateEmission'],
      columns: 2,
    },
    {
      id: 'motif',
      title: tr('ventes.avoir.form.sections.motif'),
      icon: 'message-square',
      fields: ['motif'],
      columns: 1,
    },
    {
      id: 'lignes',
      title: tr('ventes.avoir.form.sections.lignes'),
      icon: 'list',
      fields: ['lignes'],
      columns: 1,
    },
    {
      id: 'totaux',
      title: tr('ventes.avoir.form.sections.totaux'),
      icon: 'calculator',
      fields: ['totalHt', 'tvaTaux', 'totalTva', 'totalTtc'],
      columns: 4,
    },
    {
      id: 'autres',
      title: tr('ventes.avoir.form.sections.autres'),
      icon: 'file-text',
      fields: ['notes'],
      columns: 1,
    },
  ];
}
