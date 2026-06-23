/**
 * API Configuration Service
 * 
 * Provides the API base URL from environment configuration.
 */

import { Injectable, Signal, computed } from '@angular/core';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  readonly apiBaseUrl: Signal<string> = computed(() => this.resolveApiBaseUrl());

  private resolveApiBaseUrl(): string {
    const fallback = environment.apiBaseUrl;
    if (typeof window === 'undefined') {
      return fallback;
    }

    const { protocol, hostname } = window.location;

    // E2E / local dev server: same-origin so /api is proxied (proxy.conf.json).
    if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]') {
      return `${protocol}//${window.location.host}`;
    }

    // App-specific host convention:
    // <app-id>.nafura.local        -> api.<app-id>.nafura.local  (local: erp.nafura.local)
    // <slug>.nafuralabs.com        -> api.<slug>.nafuralabs.com  (prod: sektor.nafuralabs.com)
    const localMatch = hostname.match(/^([a-z0-9-]+)\.nafura\.local$/i);
    if (localMatch) {
      const appId = localMatch[1].toLowerCase();
      if (!['app', 'api', 'iam', 'minio', 's3'].includes(appId)) {
        return `${protocol}//api.${appId}.nafura.local`;
      }
    }

    const prodMatch = hostname.match(/^([a-z0-9-]+)\.nafuralabs\.com$/i);
    if (prodMatch) {
      const appId = prodMatch[1].toLowerCase();
      if (!['app', 'api', 'iam', 'minio', 's3', 'www'].includes(appId)) {
        return `${protocol}//api.${appId}.nafuralabs.com`;
      }
    }

    return fallback;
  }

  /**
   * Get the current API base URL value (synchronous getter).
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl();
  }
}
