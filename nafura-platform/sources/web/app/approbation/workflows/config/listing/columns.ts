import type { ColumnConfig } from '@lib/anatomy/types';
import type { WorkflowTemplate } from '../../models';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: 'administration.workflows.columns.name',
    field: 'name',
    sortable: true,
  },
  {
    key: 'code',
    label: 'administration.workflows.columns.code',
    field: 'code',
    sortable: true,
  },
  {
    key: 'entityType',
    label: 'administration.workflows.columns.entityType',
    field: 'entityType',
    type: 'badge',
    sortable: true,
  },
  {
    key: 'stepCount',
    label: 'administration.workflows.columns.steps',
    field: 'stepCount',
    transform: (value: unknown) => (value == null ? '0' : String(value)),
    sortable: false,
  },
  {
    key: 'isActive',
    label: 'administration.workflows.columns.status',
    field: 'isActive',
    type: 'badge',
    badgeVariant: (value: unknown) => (value === true ? 'success' : 'default'),
    transform: (value: unknown) =>
      value === true
        ? 'administration.workflows.status.active'
        : 'administration.workflows.status.inactive',
    sortable: true,
  },
];
