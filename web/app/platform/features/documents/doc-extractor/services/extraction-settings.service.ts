import { inject, Injectable, effect } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { TenantContextService } from '../../../../core/tenant/tenant.context';

export type AutoValidationPolicy = 'MANUAL' | 'CONFIDENCE' | 'ALWAYS';

export interface ExtractionGeneralSettings {
  autoValidateAll: boolean;
  autoValidationPolicy: AutoValidationPolicy;
}

export const DEFAULT_GENERAL_SETTINGS: ExtractionGeneralSettings = {
  autoValidateAll: false,
  autoValidationPolicy: 'MANUAL',
};

@Injectable({ providedIn: 'root' })
export class ExtractionSettingsService {
  private readonly tenantContext = inject(TenantContextService);

  private readonly generalSettings$ = new BehaviorSubject<ExtractionGeneralSettings>(
    DEFAULT_GENERAL_SETTINGS
  );

  constructor() {
    // Reload settings whenever tenant changes so each tenant keeps isolated preferences.
    effect(() => {
      const tenantId = this.tenantContext.tenantId();
      const loaded = this.loadFromStorage(tenantId ?? 'default');
      this.generalSettings$.next(loaded);
    });
  }

  getGeneralSettings(): Observable<ExtractionGeneralSettings> {
    return this.generalSettings$.asObservable();
  }

  updateGeneralSettings(
    partial: Partial<ExtractionGeneralSettings>
  ): Observable<ExtractionGeneralSettings> {
    const current = this.generalSettings$.value;
    const next: ExtractionGeneralSettings = {
      ...current,
      ...partial,
    };

    this.generalSettings$.next(next);
    this.persistToStorage(next);
    return of(next);
  }

  private storageKey(): string {
    const tenantId = this.tenantContext.tenantId();
    return `doc-extractor:settings:general:${tenantId ?? 'default'}`;
  }

  private loadFromStorage(scope: string): ExtractionGeneralSettings {
    try {
      const raw = localStorage.getItem(`doc-extractor:settings:general:${scope}`);
      if (!raw) {
        return { ...DEFAULT_GENERAL_SETTINGS };
      }
      const parsed = JSON.parse(raw) as Partial<ExtractionGeneralSettings>;
      return {
        ...DEFAULT_GENERAL_SETTINGS,
        ...parsed,
      };
    } catch {
      return { ...DEFAULT_GENERAL_SETTINGS };
    }
  }

  private persistToStorage(settings: ExtractionGeneralSettings): void {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(settings));
    } catch {
      // Fail silently; UI will still reflect BehaviorSubject value.
    }
  }
}

