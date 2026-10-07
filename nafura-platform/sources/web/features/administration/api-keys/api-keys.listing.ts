import type { ListingPageConfig, Row } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/platform/admin/api-keys';
const PERMISSION = 'administration.integrations.api-keys';
const EXPIRY_DAYS: Record<string, number | null> = { never: null, '30d': 30, '90d': 90, '1y': 365 };
const COLUMNS = ['name', 'keyPrefix', 'permissionCount', 'expiresAt', 'lastUsedAt', 'state'];

/** API keys: a record. The key is shown once after creation; a key is revoked, then deleted. */
export const API_KEYS_LISTING: ListingPageConfig = {
  title: 'administration.apiKeys.title',
  subtitle: 'administration.apiKeys.subtitle',
  icon: 'key-round',
  endpoint: ENDPOINT,
  views: [
    { id: 'active', label: 'administration.apiKeys.segments.active', layout: 'table', filter: { state: { is: 'Active' } }, show: COLUMNS },
    { id: 'revoked', label: 'administration.apiKeys.segments.revoked', layout: 'table', filter: { state: { in: ['Révoquée', 'Expirée'] } }, show: COLUMNS },
    { id: 'all', label: 'administration.apiKeys.segments.all', layout: 'table', show: COLUMNS },
  ],
  emptyState: { icon: 'key-round', title: 'administration.apiKeys.empty', message: 'administration.apiKeys.emptyHint' },
  actions: [
    {
      id: 'create',
      label: 'administration.apiKeys.actions.create',
      icon: 'plus',
      variant: 'primary',
      permission: `${PERMISSION}.create`,
      form: {
        title: 'administration.apiKeys.dialog.createTitle',
        fields: [
          { key: 'name', field: 'name', label: 'administration.apiKeys.fields.name', type: 'text', required: true },
          { key: 'permissions', field: 'permissions', label: 'administration.apiKeys.fields.permissions', type: 'text', placeholder: 'demo.purchasing.supplier.read, demo.purchasing.supplier.create' },
          {
            key: 'expiry',
            field: 'expiry',
            label: 'administration.apiKeys.fields.expiry',
            type: 'select',
            defaultValue: '90d',
            options: Object.keys(EXPIRY_DAYS).map((value) => ({ value, label: `administration.apiKeys.expiry.${value}` })),
          },
        ],
        values: () => ({ expiry: '90d' }),
        body: ({ name, permissions, expiry }) => {
          const days = EXPIRY_DAYS[String(expiry)];
          return {
            name,
            permissions: String(permissions ?? '').split(',').map((p) => p.trim()).filter(Boolean),
            expiresAt: days ? new Date(Date.now() + days * 86_400_000).toISOString() : null,
          };
        },
      },
      request: { method: 'POST' },
      reveal: { field: 'plainKey', title: 'administration.apiKeys.created.title', message: 'administration.apiKeys.created.warning' },
    },
    {
      id: 'revoke',
      row: true,
      label: 'administration.apiKeys.actions.revoke',
      icon: 'ban',
      variant: 'danger',
      permission: `${PERMISSION}.update`,
      when: (key: Row) => key['active'] === true,
      confirm: { title: 'administration.apiKeys.actions.revoke', message: 'administration.apiKeys.actions.revokeConfirm', confirmLabel: 'administration.apiKeys.actions.revoke', danger: true },
      request: { method: 'POST', url: `${ENDPOINT}/{id}/revoke` },
      success: 'administration.apiKeys.revoked',
    },
    {
      id: 'delete',
      row: true,
      label: 'administration.apiKeys.actions.delete',
      icon: 'trash-2',
      variant: 'danger',
      permission: `${PERMISSION}.delete`,
      when: (key: Row) => key['active'] !== true,
      confirm: { title: 'administration.apiKeys.actions.delete', message: 'administration.apiKeys.actions.deleteConfirm', confirmLabel: 'administration.apiKeys.actions.delete', danger: true },
      request: { method: 'DELETE' },
      success: 'administration.apiKeys.deleted',
    },
  ],
};
