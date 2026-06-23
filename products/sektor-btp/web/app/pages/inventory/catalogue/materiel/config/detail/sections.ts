import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Materiel } from '../../models';

export function buildMaterielSections(t: TranslateService): DetailSectionConfig<Materiel>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identification',
      title: tr('inventory.catalogue.materiel.sections.identification'),
      fields: ['code', 'name', 'familleId', 'description'],
      columns: 2,
    },
    {
      id: 'caracteristiques',
      title: tr('inventory.catalogue.materiel.sections.caracteristiques'),
      fields: ['marque', 'modele', 'numeroSerie', 'anneeMiseEnService', 'puissanceCapacite'],
      columns: 2,
    },
    {
      id: 'etat',
      title: tr('inventory.catalogue.materiel.sections.statut'),
      fields: ['status', 'dateDernierEntretien', 'prochaineMaintenance', 'notesMaintenance', 'isActive'],
      columns: 2,
    },
  ];
}
