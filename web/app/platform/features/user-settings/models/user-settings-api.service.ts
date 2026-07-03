import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

import type {
  ActiveSession,
  ChangePasswordRequest,
  UserNotificationSettings,
  UserPreferencesSettings,
  UserProfileSettings,
  UserProfileUpdatePayload,
} from './user-settings.model';

@Injectable({ providedIn: 'root' })
export class UserSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getProfile(): Observable<UserProfileSettings> {
    return this.http.get<UserProfileSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/profile`
    );
  }

  updateProfile(payload: UserProfileUpdatePayload): Observable<UserProfileSettings> {
    return this.http.put<UserProfileSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/profile`,
      payload
    );
  }

  getPreferences(): Observable<UserPreferencesSettings> {
    return this.http.get<UserPreferencesSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/preferences`
    );
  }

  updatePreferences(
    payload: UserPreferencesSettings
  ): Observable<UserPreferencesSettings> {
    return this.http.put<UserPreferencesSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/preferences`,
      payload
    );
  }

  getNotifications(): Observable<UserNotificationSettings> {
    return this.http.get<UserNotificationSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/notifications`
    );
  }

  updateNotifications(
    payload: UserNotificationSettings
  ): Observable<UserNotificationSettings> {
    return this.http.put<UserNotificationSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/notifications`,
      payload
    );
  }

  getSessions(): Observable<ActiveSession[]> {
    return this.http.get<ActiveSession[]>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/sessions`
    );
  }

  revokeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/sessions/${sessionId}`
    );
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/user-settings/change-password`,
      payload
    );
  }
}
