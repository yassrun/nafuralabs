import type { FormFieldConfig } from '../../../lib/anatomy/types';
import type { ListingPageConfig, Row } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/platform/admin/webhooks';
const PERMISSION = 'administration.integrations.webhooks';
const COLUMNS = ['name', 'url', 'eventCount', 'active', 'lastDeliveryStatus', 'createdAt'];
const EVENTS = [
  'ENTITY_CREATED',
  'ENTITY_UPDATED',
  'ENTITY_DELETED',
  'APPROVAL_REQUESTED',
  'APPROVAL_APPROVED',
  'APPROVAL_REJECTED',
  'MEMBER_INVITED',
  'MEMBER_ACTIVATED',
  'DOMAIN_ACTIVATED',
];

const fields = (secretRequired: boolean): FormFieldConfig[] => [
  { key: 'name', field: 'name', label: 'administration.webhooks.form.name', type: 'text', required: true },
  { key: 'url', field: 'url', label: 'administration.webhooks.form.url', type: 'text', required: true, placeholder: 'https://', validation: { pattern: '^https?://.+' } },
  {
    key: 'secret',
    field: 'secret',
    label: 'administration.webhooks.form.secret',
    type: 'text',
    required: secretRequired,
    helpText: secretRequired ? 'administration.webhooks.form.secretHelp' : 'administration.webhooks.form.secretKeep',
  },
  {
    key: 'events',
    field: 'events',
    label: 'administration.webhooks.form.events',
    type: 'multiselect',
    required: true,
    options: EVENTS.map((value) => ({ value, label: `administration.webhooks.events.${value}` })),
  },
  { key: 'active', field: 'active', label: 'administration.webhooks.form.active', type: 'checkbox' },
];

const randomSecret = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, '0')).join('');

/** Outgoing webhooks: a record. The secret is written, never read back; a blank one on update keeps it. */
export const WEBHOOKS_LISTING: ListingPageConfig = {
  title: 'administration.webhooks.title',
  subtitle: 'administration.webhooks.subtitle',
  icon: 'webhook',
  endpoint: ENDPOINT,
  quickFilters: [{ property: 'lastDeliveryStatus' }],
  views: [
    { id: 'all', label: 'administration.webhooks.views.all', layout: 'table', show: COLUMNS },
    { id: 'active', label: 'administration.webhooks.views.active', layout: 'table', filter: { active: { is: true } }, show: COLUMNS },
    { id: 'failing', label: 'administration.webhooks.views.failing', layout: 'table', filter: { lastDeliveryStatus: { is: 'Échouée' } }, show: COLUMNS, hideQuickFilters: ['lastDeliveryStatus'] },
  ],
  emptyState: { icon: 'webhook', title: 'administration.webhooks.empty', message: 'administration.webhooks.emptyHint' },
  open: (webhook: Row) => `/administration/webhooks/${webhook['id']}`,
  actions: [
    {
      id: 'create',
      label: 'administration.webhooks.actions.create',
      icon: 'plus',
      variant: 'primary',
      permission: `${PERMISSION}.create`,
      form: {
        title: 'administration.webhooks.dialog.createTitle',
        fields: fields(true),
        values: () => ({ secret: randomSecret(), events: ['ENTITY_UPDATED'], active: true }),
      },
      request: { method: 'POST' },
      success: 'administration.webhooks.saved',
    },
    {
      id: 'edit',
      row: true,
      label: 'administration.webhooks.actions.edit',
      icon: 'pencil',
      permission: `${PERMISSION}.update`,
      form: {
        title: 'administration.webhooks.dialog.editTitle',
        fields: fields(false),
        values: (webhook) => ({ name: webhook?.['name'], url: webhook?.['url'], events: webhook?.['events'], active: webhook?.['active'] }),
        body: (values) => ({ ...values, secret: values['secret'] ?? '' }),
      },
      request: { method: 'PUT' },
      success: 'administration.webhooks.saved',
    },
    {
      id: 'test',
      row: true,
      label: 'administration.webhooks.actions.test',
      icon: 'send',
      permission: `${PERMISSION}.update`,
      request: { method: 'POST', url: `${ENDPOINT}/{id}/test` },
      success: 'administration.webhooks.actions.testSuccess',
      failed: (response) => response['success'] !== true,
      failure: 'administration.webhooks.actions.testFailed',
    },
    {
      id: 'delete',
      row: true,
      label: 'administration.webhooks.actions.delete',
      icon: 'trash-2',
      variant: 'danger',
      permission: `${PERMISSION}.delete`,
      confirm: { title: 'administration.webhooks.actions.delete', message: 'administration.webhooks.deleteConfirm', confirmLabel: 'administration.webhooks.actions.delete', danger: true },
      request: { method: 'DELETE' },
      success: 'administration.webhooks.deleted',
    },
  ],
};
