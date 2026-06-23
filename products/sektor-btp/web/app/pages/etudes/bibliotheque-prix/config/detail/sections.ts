import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Ouvrage } from '@applications/erp/etudes/models';

export const SECTIONS: DetailSectionConfig<Ouvrage>[] = [
  {
    id: 'identite',
    title: 'Identité',
    icon: 'tag',
    fields: ['code', 'designation', 'category', 'unite', 'isActive', 'notes'],
    columns: 2,
  },
  {
    id: 'parametres',
    title: 'Paramètres de calcul',
    icon: 'sliders',
    fields: ['fraisGenerauxPercent', 'beneficePercent', 'prixUnitaireHt'],
    columns: 3,
  },
  {
    id: 'composants',
    title: 'Sous-détail (matériaux + main d\'œuvre + frais + bénéfice)',
    icon: 'layers',
    fields: ['composants'],
    columns: 1,
  },
  {
    id: 'dpu',
    title: 'DPU — Décomposition prix unitaire (CCAG-T)',
    icon: 'calculate',
    fields: ['dpuComposants'],
    columns: 1,
  },
];
