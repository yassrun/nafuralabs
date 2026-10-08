import type { FormFieldConfig } from '../../../lib/anatomy/types';
import type { ListingPageConfig } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/platform/email-templates';
const PERMISSION = 'administration.notifications.email-templates';
const COLUMNS = ['name', 'code', 'typeLabel', 'entityType', 'updatedAt'];
const t = (key: string) => `administration.emailTemplates.${key}`;

const CREATE_FIELDS: FormFieldConfig[] = [
  { key: 'name', field: 'name', label: t('fields.name'), type: 'text', required: true },
  { key: 'code', field: 'code', label: t('fields.code'), type: 'text', required: true },
  { key: 'subject', field: 'subject', label: t('fields.subject'), type: 'text', required: true },
  { key: 'entityType', field: 'entityType', label: t('fields.entityType'), type: 'text' },
];

/** Email templates: tenant customs plus platform system rows (tenant_id null). */
export const EMAIL_TEMPLATES_LISTING: ListingPageConfig = {
  title: t('title'),
  subtitle: t('subtitle'),
  icon: 'send',
  endpoint: ENDPOINT,
  quickFilters: [{ property: 'typeLabel' }],
  views: [
    { id: 'all', label: t('views.all'), layout: 'table', show: COLUMNS },
    {
      id: 'system',
      label: t('type.system'),
      layout: 'table',
      filter: { isSystem: { is: true } },
      show: COLUMNS,
    },
    {
      id: 'custom',
      label: t('type.custom'),
      layout: 'table',
      filter: { isSystem: { is: false } },
      show: COLUMNS,
    },
  ],
  emptyState: { icon: 'send', title: t('empty'), message: t('emptyMessage') },
  open: (row) => `/administration/email-templates/${row['id']}`,
  actions: [
    {
      id: 'create',
      label: t('create'),
      icon: 'plus',
      variant: 'primary',
      permission: `${PERMISSION}.create`,
      form: {
        title: t('create'),
        fields: CREATE_FIELDS,
        body: (values) => ({
          ...values,
          code: String(values['code'] ?? '').trim(),
          entityType: String(values['entityType'] ?? '').trim() || null,
          htmlBody: '',
        }),
      },
      request: { method: 'POST' },
      success: t('createSuccess'),
    },
    {
      id: 'delete',
      row: true,
      label: 'common.actions.delete',
      icon: 'trash-2',
      variant: 'danger',
      permission: `${PERMISSION}.delete`,
      when: (row) => row['isSystem'] !== true,
      confirm: {
        title: t('delete.confirmTitle'),
        message: t('delete.confirmMessage'),
        confirmLabel: 'common.actions.delete',
        danger: true,
      },
      request: { method: 'DELETE' },
      success: t('delete.success'),
    },
  ],
};
