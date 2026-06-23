/**
 * Application Context Service
 *
 * Detects and exposes current application identity from hostname.
 * Uses CRUX-generated active application id as baseline fallback.
 */

import { Injectable, Signal, signal } from '@angular/core';
import { ApplicationKey } from './application-key';
import { ACTIVE_APPLICATION_ID } from '../../../applications/routes.generated';

@Injectable({ providedIn: 'root' })
export class ApplicationContextService {
  private readonly fallbackApplicationId = this.normalizeApplicationId(ACTIVE_APPLICATION_ID) || 'unknown';
  private readonly _applicationKey = signal<ApplicationKey>(this.fallbackApplicationId);

  /** Current application key */
  readonly applicationKey: Signal<ApplicationKey> = this._applicationKey.asReadonly();

  constructor() {
    const detected = this.detectFromHostname(window.location.hostname);
    this._applicationKey.set(detected);
  }

  detectFromHostname(hostname: string): ApplicationKey {
    const normalizedHost = hostname.toLowerCase();
    const firstPart = normalizedHost.split('.')[0];

    if (firstPart === 'platform' || firstPart === 'app' || firstPart === 'localhost' || firstPart === '127') {
      return this.fallbackApplicationId;
    }

    const normalizedFirstPart = this.normalizeApplicationId(firstPart);
    if (normalizedFirstPart) {
      return normalizedFirstPart;
    }

    return this.fallbackApplicationId;
  }

  private normalizeApplicationId(value: string): string {
    if (typeof value !== 'string') {
      return '';
    }
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return '';
    }
    if (!/^[a-z][a-z0-9-]*$/.test(normalized)) {
      return '';
    }
    return normalized;
  }

  isApplication(key: ApplicationKey): boolean {
    return this._applicationKey() === key;
  }
}
