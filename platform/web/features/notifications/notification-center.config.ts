export interface NotificationFilterOption {
  labelKey: string;
  value: string;
}

export const NOTIFICATION_SOURCE_OPTIONS: NotificationFilterOption[] = [
  { labelKey: 'notifications.center.filters.source.all', value: 'all' },
  { labelKey: 'notifications.center.filters.source.workflow', value: 'workflow' },
  { labelKey: 'notifications.center.filters.source.assignment', value: 'assignment' },
  { labelKey: 'notifications.center.filters.source.mention', value: 'mention' },
  { labelKey: 'notifications.center.filters.source.system', value: 'system' },
];

export const NOTIFICATION_STATUS_OPTIONS: NotificationFilterOption[] = [
  { labelKey: 'notifications.center.filters.status.all', value: 'all' },
  { labelKey: 'notifications.center.filters.status.unread', value: 'unread' },
  { labelKey: 'notifications.center.filters.status.read', value: 'read' },
];

export const NOTIFICATION_RANGE_OPTIONS: NotificationFilterOption[] = [
  { labelKey: 'notifications.center.filters.range.24h', value: '24h' },
  { labelKey: 'notifications.center.filters.range.7d', value: '7d' },
  { labelKey: 'notifications.center.filters.range.30d', value: '30d' },
  { labelKey: 'notifications.center.filters.range.all', value: 'all' },
];
