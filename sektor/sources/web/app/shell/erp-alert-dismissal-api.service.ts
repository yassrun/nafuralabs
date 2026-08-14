import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@platform/core/config/api-config.service';

const BASE = '/api/v1/erp/alerts';

@Injectable({ providedIn: 'root' })
export class ErpAlertDismissalApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  async listDismissedKeys(): Promise<Set<string>> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ keys: string[] }>(this.url(`${BASE}/dismissals`)),
      );
      return new Set(res.keys ?? []);
    } catch {
      return new Set();
    }
  }

  async dismiss(alertKey: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(this.url(`${BASE}/dismiss`), { alertKey }),
    );
  }

  async cleanupResolved(activeKeys: string[]): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(this.url(`${BASE}/dismissals/cleanup`), { activeKeys }),
      );
    } catch {
      /* best effort */
    }
  }
}
