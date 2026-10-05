export type PlatformNotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface PlatformNotification {
  readonly id: string;
  readonly title: string;
  readonly message?: string;
  readonly level?: PlatformNotificationLevel;
  readonly read?: boolean;
  readonly createdAt?: string;
  /** Explicit link from the API, or the record route resolved from entityType/entityId. */
  readonly route?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly actionUrl?: string;
  /** Declared event id (`demo.purchasing.request.approved`, …). */
  readonly source?: string;
  /** French label of the event for the inbox row. */
  readonly sourceLabel?: string;
}

export interface PlatformNotificationListResult {
  readonly items: readonly PlatformNotification[];
  readonly page: number;
  readonly totalElements: number;
  readonly last: boolean;
}
