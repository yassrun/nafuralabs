import type { LegacyListingPageConfig } from '../../../platform/listing/legacy';

interface ApiKey extends Record<string, unknown> {
  name: string;
  keyPrefix: string | null;
  permissions: string[];
  expiresAt: string | null;
  active: boolean;
}

const status = (key: ApiKey): 'active' | 'revoked' | 'expired' =>
  !key.active ? 'revoked' : key.expiresAt && new Date(key.expiresAt) < new Date() ? 'expired' : 'active';

const EXPIRY_DAYS: Record<string, number | null> = { never: null, '30d': 30, '90d': 90, '1y': 365 };

export const API_KEYS_LISTING: LegacyListingPageConfig<ApiKey> = {
  title: 'administration.apiKeys.title',
  subtitle: 'administration.apiKeys.subtitle',
  icon: 'key-round',
  endpoint: '/api/v1/platform/admin/api-keys',
  emptyMessage: 'administration.apiKeys.empty',
  searchFields: ['name'],
  segments: [
    { id: 'active', label: 'administration.apiKeys.segments.active', filters: { active: true } },
    { id: 'revoked', label: 'administration.apiKeys.segments.revoked', filters: { active: false } },
    { id: 'all', label: 'administration.apiKeys.segments.all' },
  ],
  columns: [
    { key: 'name', field: 'name', label: 'administration.apiKeys.columns.name', sortable: true },
    { key: 'key', field: 'keyPrefix', label: 'administration.apiKeys.columns.key', transform: (prefix) => `${prefix || 'nfk_'}••••`, cssClass: 'nf-cell--mono' },
    { key: 'permissions', field: 'permissions', label: 'administration.apiKeys.columns.permissions', transform: (permissions) => String((permissions as string[] | null)?.length ?? 0), width: '120px' },
    { key: 'expires', field: 'expiresAt', label: 'administration.apiKeys.columns.expires', type: 'date', sortable: true },
    { key: 'lastUsed', field: 'lastUsedAt', label: 'administration.apiKeys.columns.lastUsed', type: 'relative', sortable: true },
    {
      key: 'status',
      field: 'active',
      label: 'administration.apiKeys.columns.status',
      type: 'badge',
      transform: (_, key) => `administration.apiKeys.status.${status(key as ApiKey)}`,
      badgeVariant: (_, key) => ({ active: 'success', revoked: 'danger', expired: 'warning' } as const)[status(key as ApiKey)],
      width: '130px',
    },
  ],
  actions: [
    {
      id: 'create',
      label: 'administration.apiKeys.actions.create',
      icon: 'plus',
      variant: 'primary',
      permission: 'administration.api-keys.write',
      form: {
        title: 'administration.apiKeys.dialog.createTitle',
        fields: [
          { key: 'name', field: 'name', label: 'administration.apiKeys.fields.name', type: 'text', required: true },
          { key: 'permissions', field: 'permissions', label: 'administration.apiKeys.fields.permissions', type: 'text', placeholder: 'demo.notes.note.read, demo.notes.note.create' },
          {
            key: 'expiry',
            field: 'expiry',
            label: 'administration.apiKeys.fields.expiry',
            type: 'select',
            defaultValue: '90d',
            options: Object.keys(EXPIRY_DAYS).map((value) => ({ value, label: `administration.apiKeys.expiry.${value}` })),
          },
        ],
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
      permission: 'administration.api-keys.write',
      when: (key) => key.active,
      confirm: { title: 'administration.apiKeys.actions.revoke', message: 'administration.apiKeys.actions.revokeConfirm', confirmLabel: 'administration.apiKeys.actions.revoke', danger: true },
      request: { method: 'DELETE' },
      success: 'administration.apiKeys.revoked',
    },
  ],
};
