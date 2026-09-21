export interface PlatformNotificationDto {
  readonly id: string;
  readonly title: string;
  readonly body?: string;
  readonly isRead?: boolean;
  readonly sentAt?: string;
  readonly actionUrl?: string;
}

export interface PlatformNotificationPage {
  readonly content: readonly PlatformNotificationDto[];
}
