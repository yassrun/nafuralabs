import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@platform/core/config/api-config.service';

import type { CompletenessResult } from '../onboarding/services/onboarding-api.service';

export interface ChromeAlertDto {
  id: string;
  type: 'APPROBATION' | 'FACTURE_RETARD' | 'CAUTION_EXPIRY' | 'NC_CRITIQUE' | 'PILOTAGE';
  titre?: string | null;
  titreKey?: string | null;
  titreParams?: Record<string, string | number> | null;
  detail: string;
  urgence: 'HAUTE' | 'NORMALE';
  route: string;
  date: string;
}

export interface ChromeSnapshot {
  completeness: CompletenessResult | null;
  alerts: ChromeAlertDto[];
}

@Injectable({ providedIn: 'root' })
export class ErpChromeSnapshotService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  readonly completeness = signal<CompletenessResult | null>(null);

  async load(): Promise<ChromeSnapshot> {
    const base = this.apiConfig.apiBaseUrl();
    const snap = await firstValueFrom(
      this.http.get<ChromeSnapshot>(`${base}/api/v1/erp/chrome`),
    );
    this.completeness.set(snap.completeness ?? null);
    return {
      completeness: snap.completeness ?? null,
      alerts: snap.alerts ?? [],
    };
  }
}
