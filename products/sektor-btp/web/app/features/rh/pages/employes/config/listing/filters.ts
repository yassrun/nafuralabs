import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildEmployeFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'statut', label: tr('rh.employe.filters.statut'), type: 'select',
      options: [
        { value: 'ACTIF', label: tr('rh.employe.statuses.ACTIF') },
        { value: 'SUSPENDU', label: tr('rh.employe.statuses.SUSPENDU') },
        { value: 'SOLDE', label: tr('rh.employe.statuses.SOLDE') },
      ],
    },
    {
      key: 'typeContrat', label: tr('rh.employe.filters.typeContrat'), type: 'select',
      options: [
        { value: 'CDI', label: tr('rh.employe.types.CDI') },
        { value: 'CDD', label: tr('rh.employe.types.CDD') },
        { value: 'ANAPEC', label: tr('rh.employe.types.ANAPEC') },
        { value: 'Saisonnier', label: tr('rh.employe.types.Saisonnier') },
        { value: 'Interim', label: tr('rh.employe.types.Interim') },
      ],
    },
    {
      key: 'categorie', label: tr('rh.employe.filters.categorie'), type: 'select',
      options: [
        { value: 'Ouvrier', label: tr('rh.employe.categories.Ouvrier') },
        { value: 'Agent_maitrise', label: tr('rh.employe.categories.Agent_maitrise') },
        { value: 'Cadre', label: tr('rh.employe.categories.Cadre') },
        { value: 'Direction', label: tr('rh.employe.categories.Direction') },
      ],
    },
  ];
}
