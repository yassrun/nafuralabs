import type { FormFieldConfig } from '../../../lib/anatomy/types';
import type { LegacyListingPageConfig } from '../../../platform/listing/legacy';

interface Webhook extends Record<string, unknown> {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastDeliveryStatus: string | null;
}

const ENDPOINT = '/api/v1/platform/admin/webhooks';
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

export const WEBHOOKS_LISTING: LegacyListingPageConfig<Webhook> = {
  title: 'administration.webhooks.title',
  subtitle: 'administration.webhooks.subtitle',
  icon: 'webhook',
  endpoint: ENDPOINT,
  emptyMessage: 'administration.webhooks.empty',
  searchFields: ['name', 'url'],
  open: (webhook) => `/administration/webhooks/${webhook.id}`,
  columns: [
    { key: 'name', field: 'name', label: 'administration.webhooks.columns.name', sortable: true },
    { key: 'url', field: 'url', label: 'administration.webhooks.columns.url', cssClass: 'nf-cell--mono' },
    { key: 'events', field: 'events', label: 'administration.webhooks.columns.events', transform: (events) => String((events as string[] | null)?.length ?? 0), width: '110px' },
    { key: 'active', field: 'active', label: 'administration.webhooks.columns.active', type: 'boolean', width: '90px' },
    {
      key: 'lastDelivery',
      field: 'lastDeliveryStatus',
      label: 'administration.webhooks.columns.lastDelivery',
      type: 'badge',
      transform: (status) => `administration.webhooks.delivery.${status ?? 'NONE'}`,
      badgeVariant: (status) => (status === 'SUCCESS' ? 'success' : status === 'FAILED' ? 'danger' : 'default'),
      width: '150px',
    },
    { key: 'createdAt', field: 'createdAt', label: 'administration.webhooks.columns.created', type: 'relative', sortable: true, width: '140px' },
  ],
  actions: [
    {
      id: 'create',
      label: 'administration.webhooks.actions.create',
      icon: 'plus',
      variant: 'primary',
      permission: 'administration.webhooks.write',
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
      permission: 'administration.webhooks.write',
      form: {
        title: 'administration.webhooks.dialog.editTitle',
        fields: fields(false),
        values: (webhook) => ({ name: webhook?.name, url: webhook?.url, events: webhook?.events, active: webhook?.active }),
      },
      request: { method: 'PUT' },
      success: 'administration.webhooks.saved',
    },
    {
      id: 'test',
      row: true,
      label: 'administration.webhooks.actions.test',
      icon: 'send',
      permission: 'administration.webhooks.write',
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
      permission: 'administration.webhooks.write',
      confirm: { title: 'administration.webhooks.actions.delete', message: 'administration.webhooks.deleteConfirm', confirmLabel: 'administration.webhooks.actions.delete', danger: true },
      request: { method: 'DELETE' },
      success: 'administration.webhooks.deleted',
    },
  ],
};
