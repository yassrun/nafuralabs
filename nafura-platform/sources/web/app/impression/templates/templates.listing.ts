import type { FormFieldConfig } from '../../../lib/anatomy/types';
import type { ListingPageConfig, Row } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/platform/templates';
const PERMISSION = 'administration.documents.templates';
const COLUMNS = ['name', 'entityType', 'typeLabel', 'paperSize', 'updatedAt'];
const t = (key: string) => `administration.templates.${key}`;

const CREATE_FIELDS: FormFieldConfig[] = [
  { key: 'name', field: 'name', label: t('fields.name'), type: 'text', required: true },
  { key: 'code', field: 'code', label: t('fields.code'), type: 'text', required: true },
  { key: 'entityType', field: 'entityType', label: t('fields.entityType'), type: 'text', required: true },
];

const cloneBody = (values: Record<string, unknown>, source?: Row) => ({
  name: values['name'],
  code: values['code'],
  entityType: values['entityType'],
  cloneFromId: source?.['id'],
});

/** Print templates: a record. Type label is computed on the server. */
export const PRINT_TEMPLATES_LISTING: ListingPageConfig = {
  title: t('title'),
  subtitle: t('subtitle'),
  icon: 'file-text',
  endpoint: ENDPOINT,
  quickFilters: [{ property: 'typeLabel' }],
  views: [
    { id: 'all', label: 'common.all', layout: 'table', show: COLUMNS },
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
  emptyState: { icon: 'file-text', title: t('empty'), message: t('emptyMessage') },
  open: (row) => `/administration/documents/templates/${row['id']}`,
  actions: [
    {
      id: 'create',
      label: t('create'),
      icon: 'plus',
      variant: 'primary',
      permission: `${PERMISSION}.create`,
      route: '/administration/documents/templates/new',
    },
    {
      id: 'clone',
      row: true,
      label: t('clone'),
      icon: 'copy',
      permission: `${PERMISSION}.create`,
      when: (row) => row['isSystem'] === true,
      form: {
        title: t('clone'),
        fields: CREATE_FIELDS,
        values: (source) => ({
          name: `${source?.['name'] ?? ''} (copie)`,
          code: `${source?.['code'] ?? ''}-copy`,
          entityType: source?.['entityType'] ?? '',
        }),
        body: cloneBody,
      },
      request: { method: 'POST' },
      success: t('cloneSuccess'),
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
