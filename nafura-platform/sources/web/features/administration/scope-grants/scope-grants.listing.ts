import type { FormFieldConfig } from '../../../lib/anatomy/types';
import type { ListingPageConfig } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/platform/admin/scope-grants';
const PERMISSION = 'tenant.members.scope-grant';
const t = (key: string) => `administration.scopeGrants.${key}`;

const FIELDS: FormFieldConfig[] = [
  { key: 'userId', field: 'userId', label: t('fields.user'), type: 'select', lookupKey: 'members', required: true },
  { key: 'roleCode', field: 'roleCode', label: t('fields.role'), type: 'text', required: true },
  { key: 'entity', field: 'entity', label: t('fields.entity'), type: 'text', required: true, placeholder: 'demo.category' },
  { key: 'recordId', field: 'recordId', label: t('fields.record'), type: 'text', required: true },
];

const FORM = {
  fields: FIELDS,
  lookups: { members: '/api/v1/platform/admin/members/options' },
};

/** A role limited to one scope node and its descendants. */
export const SCOPE_GRANTS_LISTING: ListingPageConfig = {
  title: t('title'),
  subtitle: t('subtitle'),
  icon: 'folder-tree',
  endpoint: ENDPOINT,
  views: [{ id: 'all', label: t('views.all'), layout: 'table', show: ['roleCode', 'entity', 'userId', 'recordId'] }],
  emptyState: { icon: 'folder-tree', title: t('empty'), message: t('emptyHint') },
  actions: [
    {
      id: 'create',
      label: t('actions.create'),
      icon: 'plus',
      variant: 'primary',
      permission: `${PERMISSION}.create`,
      form: { title: t('dialog.createTitle'), ...FORM },
      request: { method: 'POST' },
      success: t('saved'),
    },
    {
      id: 'edit',
      row: true,
      label: t('actions.edit'),
      icon: 'pencil',
      permission: `${PERMISSION}.update`,
      form: {
        title: t('dialog.editTitle'),
        ...FORM,
        values: (grant) => ({ ...grant }),
      },
      request: { method: 'PUT' },
      success: t('saved'),
    },
    {
      id: 'delete',
      row: true,
      label: t('actions.delete'),
      icon: 'trash-2',
      variant: 'danger',
      permission: `${PERMISSION}.delete`,
      confirm: { title: t('actions.delete'), message: t('deleteConfirm'), confirmLabel: t('actions.delete'), danger: true },
      request: { method: 'DELETE' },
      success: t('deleted'),
    },
  ],
};
