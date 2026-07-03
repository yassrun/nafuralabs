import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { INSPECTION_STATUS_KEYS, type InspectionStatus } from '@applications/erp/shell/i18n-labels';

export function buildInspectionFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  const statuses: InspectionStatus[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
  return [
    {
      key: 'status', label: tr('hse.inspection.list.filters.status'), type: 'select',
      options: statuses.map((v) => ({ value: v, label: tr(INSPECTION_STATUS_KEYS[v]) })),
    },
  ];
}
