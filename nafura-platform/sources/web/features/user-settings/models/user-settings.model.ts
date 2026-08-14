export interface UserProfileSettings {
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
}

/** Payload for PUT /api/v1/user-settings/profile (email and avatar are read-only). */
export interface UserProfileUpdatePayload {
  firstName: string;
  lastName: string;
  displayName: string | null;
  phone: string | null;
}

export interface UserPreferencesSettings {
  /** Null = use tenant default */
  locale: string | null;
  /** Null = use tenant default */
  timezone: string | null;
  /** Null = use tenant default */
  theme: 'light' | 'dark' | 'system' | null;
  /** Null = use tenant default */
  dateFormat: string | null;
}

export interface UserNotificationSettings {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  digestFrequency: 'none' | 'daily' | 'weekly';
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  ipAddress: string;
  location: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
