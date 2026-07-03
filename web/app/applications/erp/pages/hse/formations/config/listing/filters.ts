import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { FORMATION_STATUS_KEYS, type FormationStatus } from '@applications/erp/shell/i18n-labels';

export function buildFormationFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  const statuses: FormationStatus[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
  return [
    {
      key: 'status', label: tr('hse.formation.list.filters.status'), type: 'select',
      options: statuses.map((v) => ({ value: v, label: tr(FORMATION_STATUS_KEYS[v]) })),
    },
  ];
}
