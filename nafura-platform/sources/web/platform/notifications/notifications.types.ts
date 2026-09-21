export type PlatformNotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface PlatformNotification {
  readonly id: string;
  readonly title: string;
  readonly message?: string;
  readonly level?: PlatformNotificationLevel;
  readonly read?: boolean;
  readonly createdAt?: string;
  readonly route?: string;
}
