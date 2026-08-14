import type { ColumnConfig } from '@lib/anatomy/types';

import type { AuditLogEntry } from '../../models';

function truncate(value: unknown, maxLen: number): string {
  if (value == null) return '';
  const s = String(value);
  return s.length <= maxLen ? s : s.slice(0, maxLen) + '…';
}

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'eventAt',
    label: 'administration.audit.columns.date',
    field: 'eventAt',
    type: 'date',
    sortable: true,
  },
  {
    key: 'actor',
    label: 'administration.audit.columns.actor',
    field: 'actor',
    sortable: true,
  },
  {
    key: 'action',
    label: 'administration.audit.columns.action',
    field: 'action',
    type: 'badge',
    sortable: true,
  },
  {
    key: 'entityType',
    label: 'administration.audit.columns.entityType',
    field: 'entityType',
    type: 'badge',
    sortable: true,
  },
  {
    key: 'details',
    label: 'administration.audit.columns.details',
    field: 'details',
    transform: (value: unknown) => truncate(value, 80),
    sortable: false,
  },
];
