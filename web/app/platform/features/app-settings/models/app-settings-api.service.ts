import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

import type {
  AppBrandingSettings,
  AppGeneralSettings,
  AppLocalizationSettings,
} from './app-settings.model';

@Injectable({ providedIn: 'root' })
export class AppSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getGeneral(): Observable<AppGeneralSettings> {
    return this.http.get<AppGeneralSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/app-settings/general`
    );
  }

  updateGeneral(payload: AppGeneralSettings): Observable<AppGeneralSettings> {
    return this.http.put<AppGeneralSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/app-settings/general`,
      payload
    );
  }

  getLocalization(): Observable<AppLocalizationSettings> {
    return this.http.get<AppLocalizationSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/app-settings/localization`
    );
  }

  updateLocalization(
    payload: AppLocalizationSettings
  ): Observable<AppLocalizationSettings> {
    return this.http.put<AppLocalizationSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/app-settings/localization`,
      payload
    );
  }

  getBranding(): Observable<AppBrandingSettings> {
    return this.http.get<AppBrandingSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/app-settings/branding`
    );
  }

  updateBranding(
    payload: AppBrandingSettings
  ): Observable<AppBrandingSettings> {
    return this.http.put<AppBrandingSettings>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/app-settings/branding`,
      payload
    );
  }

  uploadLogo(file: File): Observable<{ url: string } | string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string } | string>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/app-settings/branding/logo`,
      formData
    );
  }

  uploadFavicon(file: File): Observable<{ url: string } | string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string } | string>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/app-settings/branding/favicon`,
      formData
    );
  }
}
