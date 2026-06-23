import { Type, InjectionToken, Signal } from '@angular/core';

/** How the shell bell renders its dropdown content. */
export type NotificationBellMode = 'platform' | 'erp-alerts' | 'merged';

/**
 * Optional app-specific notification source (e.g. ERP operational alerts).
 * When provided, the bell badge and dropdown use this adapter instead of
 * overwriting {@link NotificationUnreadService} externally.
 */
export interface NotificationBellAdapter {
  readonly mode: NotificationBellMode;
  /** Badge count — must match items shown in the bell dropdown. */
  readonly count: Signal<number>;
  refresh(): Promise<void>;
  /** When false, hide platform « mark all read » (not applicable to live alerts). */
  readonly supportsMarkAllRead?: boolean;
}

export const NOTIFICATION_BELL_ADAPTER = new InjectionToken<NotificationBellAdapter>(
  'NOTIFICATION_BELL_ADAPTER',
);

/** Optional dropdown list component (e.g. ERP operational alerts). */
export const NOTIFICATION_BELL_DROPDOWN = new InjectionToken<Type<unknown>>(
  'NOTIFICATION_BELL_DROPDOWN',
);
