export interface ApiKeysColumnConfig {
  key: string;
  labelKey: string;
}

export const API_KEYS_LISTING_COLUMNS: ApiKeysColumnConfig[] = [
  { key: 'name', labelKey: 'administration.apiKeys.columns.name' },
  { key: 'key', labelKey: 'administration.apiKeys.columns.key' },
  { key: 'permissions', labelKey: 'administration.apiKeys.columns.permissions' },
  { key: 'createdBy', labelKey: 'administration.apiKeys.columns.createdBy' },
  { key: 'expires', labelKey: 'administration.apiKeys.columns.expires' },
  { key: 'lastUsed', labelKey: 'administration.apiKeys.columns.lastUsed' },
  { key: 'status', labelKey: 'administration.apiKeys.columns.status' },
];
