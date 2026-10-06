/**
 * @deprecated Use {@link PlatformNotificationStreamService} from `platform/notifications`.
 * Thin re-export so Sektor does not keep a second SSE client.
 */
export {
  PlatformNotificationStreamService as NotificationStreamService,
  type PlatformNotificationStreamPayload as NotificationStreamPayload,
} from '../../../platform/notifications/notification-stream.service';
