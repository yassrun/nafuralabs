import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

export function buildDeviseColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('finance.devise.list.columns.code'),
      field: 'code',
      sortable: true,
      width: '90px',
    },
    {
      key: 'libelle',
      label: tr('finance.devise.list.columns.libelle'),
      field: 'libelle',
      sortable: true,
    },
    {
      key: 'symbole',
      label: tr('finance.devise.list.columns.symbole'),
      field: 'symbole',
      width: '90px',
    },
    {
      key: 'precisionDecimales',
      label: tr('finance.devise.list.columns.precision'),
      field: 'precisionDecimales',
      type: 'number',
      width: '90px',
    },
    {
      key: 'isDeviseDeReference',
      label: tr('finance.devise.list.columns.reference'),
      field: 'isDeviseDeReference',
      type: 'badge',
      width: '110px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('finance.devise.referenceBadge') : tr('finance.common.dash')),
    },
    {
      key: 'isActive',
      label: tr('finance.devise.list.columns.actif'),
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('finance.devise.statusActive') : tr('finance.devise.statusInactive')),
    },
  ];
}
