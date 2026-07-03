export interface WebhooksColumnConfig {
  key: string;
  labelKey: string;
}

export const WEBHOOKS_LISTING_COLUMNS: WebhooksColumnConfig[] = [
  { key: 'name', labelKey: 'administration.webhooks.columns.name' },
  { key: 'url', labelKey: 'administration.webhooks.columns.url' },
  { key: 'events', labelKey: 'administration.webhooks.columns.events' },
  { key: 'active', labelKey: 'administration.webhooks.columns.active' },
  { key: 'status', labelKey: 'administration.webhooks.columns.lastDelivery' },
  { key: 'createdAt', labelKey: 'administration.webhooks.columns.created' },
];
