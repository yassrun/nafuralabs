export interface PlatformNotificationDto {
  readonly id: string;
  readonly title: string;
  readonly body?: string;
  readonly isRead?: boolean;
  readonly sentAt?: string;
  readonly actionUrl?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly source?: string;
}

export interface PlatformNotificationPage {
  readonly content: readonly PlatformNotificationDto[];
  readonly totalElements?: number;
  readonly totalPages?: number;
  readonly number?: number;
  readonly size?: number;
  readonly last?: boolean;
}

export type NotificationInboxView = 'unread' | 'all' | 'read';

export interface NotificationListQuery {
  readonly page?: number;
  readonly size?: number;
  readonly view?: NotificationInboxView;
  readonly source?: string;
}

export interface NotificationPreferenceSetting {
  readonly event: string;
  readonly label: string;
  readonly mandatory: boolean;
  readonly defaults: readonly string[];
  readonly organisation: readonly string[];
  readonly channels: readonly string[];
}

export interface NotificationPreferenceChoice {
  readonly event: string;
  readonly channel: string;
  readonly enabled: boolean;
}
