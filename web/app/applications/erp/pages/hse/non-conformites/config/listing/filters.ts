import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import {
  NC_STATUS_KEYS,
  NC_TYPE_KEYS,
  type NonConformiteStatus,
  type NonConformiteType,
} from '@applications/erp/shell/i18n-labels';

export function buildNcFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  const statuses: NonConformiteStatus[] = ['OUVERTE', 'EN_COURS', 'VERIFIEE', 'CLOTUREE'];
  const types: NonConformiteType[] = ['SECURITE', 'QUALITE', 'ENVIRONNEMENT', 'REGLEMENTAIRE'];
  return [
    {
      key: 'status', label: tr('hse.nonConformite.list.filters.status'), type: 'select',
      options: statuses.map((v) => ({ value: v, label: tr(NC_STATUS_KEYS[v]) })),
    },
    {
      key: 'type', label: tr('hse.nonConformite.list.filters.type'), type: 'select',
      options: types.map((v) => ({ value: v, label: tr(NC_TYPE_KEYS[v]) })),
    },
  ];
}
