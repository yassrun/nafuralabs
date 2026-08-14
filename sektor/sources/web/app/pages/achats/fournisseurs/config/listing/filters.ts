import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

const CATEGORIES = [
  'Aciers', 'Ronds à béton', 'Ciment', 'Cimentiers', 'Coffrage', 'Matériaux',
  'Agrégats', 'Granulats', 'Sable', 'Location matériel', 'Engins BTP',
  'Isolation', 'Étanchéité', 'Électricité', 'Câbles', 'Carrelage', 'Faïence',
  'Finitions', 'Carburant', 'Lubrifiants', 'Menuiserie', 'Bois',
  'Plomberie', 'Sanitaire', 'Peinture', 'Enduit', 'Services BTP', 'Adjuvants',
];

export function buildFournisseurFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'categorie',
      label: tr('achats.fournisseur.list.filters.categorie'),
      type: 'select',
      options: CATEGORIES.map((c) => ({ value: c, label: c })),
    },
    {
      key: 'notation',
      label: tr('achats.fournisseur.list.filters.notation'),
      type: 'select',
      options: [
        { value: '5', label: tr('achats.fournisseur.list.filters.notationOptions.five') },
        { value: '4', label: tr('achats.fournisseur.list.filters.notationOptions.fourPlus') },
        { value: '3', label: tr('achats.fournisseur.list.filters.notationOptions.threePlus') },
      ],
    },
    {
      key: 'isActive',
      label: tr('achats.fournisseur.list.filters.status'),
      type: 'select',
      options: [
        { value: 'true', label: tr('achats.fournisseur.list.filters.statusOptions.actifs') },
        { value: 'false', label: tr('achats.fournisseur.list.filters.statusOptions.inactifs') },
      ],
    },
  ];
}
