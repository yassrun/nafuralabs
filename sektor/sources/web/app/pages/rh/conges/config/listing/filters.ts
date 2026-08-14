import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildCongeFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status', label: tr('rh.conge.filters.statut'), type: 'select',
      options: [
        { value: 'DEMANDE', label: tr('rh.conge.statuses.DEMANDE') },
        { value: 'APPROUVE', label: tr('rh.conge.statuses.APPROUVE') },
        { value: 'REFUSE', label: tr('rh.conge.statuses.REFUSE') },
        { value: 'EN_COURS', label: tr('rh.conge.statuses.EN_COURS') },
        { value: 'SOLDE', label: tr('rh.conge.statuses.SOLDE') },
      ],
    },
    {
      key: 'type', label: tr('rh.conge.filters.type'), type: 'select',
      options: [
        { value: 'ANNUEL', label: tr('rh.conge.types.ANNUEL') },
        { value: 'MALADIE', label: tr('rh.conge.types.MALADIE') },
        { value: 'MATERNITE', label: tr('rh.conge.types.MATERNITE') },
        { value: 'SANS_SOLDE', label: tr('rh.conge.types.SANS_SOLDE') },
        { value: 'EXCEPTIONNEL', label: tr('rh.conge.types.EXCEPTIONNEL') },
      ],
    },
  ];
}
