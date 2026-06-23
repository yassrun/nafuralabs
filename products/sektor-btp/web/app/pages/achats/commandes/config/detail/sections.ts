import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildBcSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'entete',
      title: tr('achats.commande.form.sections.entete'),
      icon: 'file-text',
      fields: ['numero', 'fournisseurId', 'chantierId', 'rubrique'],
      columns: 2,
    },
    {
      id: 'planning',
      title: tr('achats.commande.form.sections.planning'),
      icon: 'calendar',
      fields: ['dateCreation', 'dateLivraisonPrevue', 'conditionsPaiement', 'modeReglement'],
      columns: 2,
    },
    {
      id: 'montants',
      title: tr('achats.commande.form.sections.montants'),
      icon: 'dollar-sign',
      fields: ['totalHt', 'tvaTaux', 'totalTtc'],
      columns: 3,
    },
    {
      id: 'notes',
      title: tr('achats.commande.form.sections.notes'),
      icon: 'edit',
      fields: ['notes'],
      columns: 1,
    },
  ];
}
