import type { ListingPageConfig, Row } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/platform/collaboration/workflow/templates';
const PERMISSION = 'administration.approvals.workflows';
const COLUMNS = ['name', 'code', 'entityType', 'stepCount', 'isActive', 'updatedAt'];

/** Approval workflow templates: a record; the editor is a dedicated page. */
export const WORKFLOWS_LISTING: ListingPageConfig = {
  title: 'administration.workflows.title',
  subtitle: 'administration.workflows.subtitle',
  icon: 'git-branch',
  endpoint: ENDPOINT,
  quickFilters: [{ property: 'entityType' }, { property: 'isActive' }],
  views: [
    { id: 'all', label: 'administration.workflows.views.all', layout: 'table', show: COLUMNS },
    {
      id: 'active',
      label: 'administration.workflows.views.active',
      layout: 'table',
      filter: { isActive: { is: true } },
      show: COLUMNS,
      hideQuickFilters: ['isActive'],
    },
    {
      id: 'inactive',
      label: 'administration.workflows.views.inactive',
      layout: 'table',
      filter: { isActive: { is: false } },
      show: COLUMNS,
      hideQuickFilters: ['isActive'],
    },
  ],
  emptyState: {
    icon: 'git-branch',
    title: 'administration.workflows.empty',
    message: 'administration.workflows.emptyHint',
  },
  open: (row: Row) => `/administration/workflows/${row['id']}`,
  actions: [
    {
      id: 'create',
      label: 'administration.workflows.create',
      icon: 'plus',
      variant: 'primary',
      permission: `${PERMISSION}.create`,
      route: '/administration/workflows/new',
    },
    {
      id: 'activate',
      row: true,
      label: 'administration.workflows.actions.activate',
      icon: 'circle-check',
      permission: `${PERMISSION}.update`,
      when: (row: Row) => row['isActive'] !== true,
      request: { method: 'POST', url: `${ENDPOINT}/{id}/activate` },
      success: 'administration.workflows.actions.activated',
    },
    {
      id: 'deactivate',
      row: true,
      label: 'administration.workflows.actions.deactivate',
      icon: 'ban',
      permission: `${PERMISSION}.update`,
      when: (row: Row) => row['isActive'] === true,
      request: { method: 'POST', url: `${ENDPOINT}/{id}/deactivate` },
      success: 'administration.workflows.actions.deactivated',
    },
    {
      id: 'delete',
      row: true,
      label: 'administration.workflows.actions.delete',
      icon: 'trash-2',
      variant: 'danger',
      permission: `${PERMISSION}.delete`,
      confirm: {
        title: 'administration.workflows.delete.confirmTitle',
        message: 'administration.workflows.delete.confirmMessage',
        confirmLabel: 'administration.workflows.actions.delete',
        danger: true,
      },
      request: { method: 'DELETE' },
      success: 'administration.workflows.delete.success',
    },
  ],
};
