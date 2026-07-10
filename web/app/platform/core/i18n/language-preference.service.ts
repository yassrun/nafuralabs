import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';

import { ApiConfigService } from '../config/api-config.service';

interface PreferencesPayload {
  locale: string | null;
  timezone: string | null;
  theme: string | null;
  dateFormat: string | null;
}

@Injectable({ providedIn: 'root' })
export class LanguagePreferenceService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private resolveUrl(path: string): string {
    return `${this.apiConfig.getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  }

  load(): Observable<string | null> {
    return this.http
      .get<PreferencesPayload>(this.resolveUrl('/api/v1/user-settings/preferences'))
      .pipe(map((response) => response?.locale ?? null));
  }

  save(locale: string): Observable<void> {
    return this.http
      .get<PreferencesPayload>(this.resolveUrl('/api/v1/user-settings/preferences'))
      .pipe(
        switchMap((current) => {
          const next: PreferencesPayload = {
            locale,
            timezone: current?.timezone ?? 'UTC',
            theme: current?.theme ?? 'system',
            dateFormat: current?.dateFormat ?? 'YYYY-MM-DD',
          };
          return this.http.put<PreferencesPayload>(
            this.resolveUrl('/api/v1/user-settings/preferences'),
            next
          );
        }),
        map(() => void 0)
      );
  }

  saveSafely(locale: string): Observable<void> {
    return this.save(locale).pipe(
      switchMap(() => of(void 0))
    );
  }
}
