import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ErpAlertDismissalApiService } from './erp-alert-dismissal-api.service';
import { ErpChromeSnapshotService, type ChromeAlertDto } from './erp-chrome-snapshot.service';

export interface ErpAlert {
  id: string;
  type: 'APPROBATION' | 'FACTURE_RETARD' | 'CAUTION_EXPIRY' | 'NC_CRITIQUE' | 'PILOTAGE';
  titre: string;
  detail: string;
  urgence: 'HAUTE' | 'NORMALE';
  route: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class ErpNotificationsService {
  private readonly chrome = inject(ErpChromeSnapshotService);
  private readonly dismissalApi = inject(ErpAlertDismissalApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  private readonly _alerts = signal<ErpAlert[]>([]);
  readonly alerts = this._alerts.asReadonly();

  readonly countHaute = computed(() => this._alerts().filter((a) => a.urgence === 'HAUTE').length);
  readonly totalCount = computed(() => this._alerts().length);

  async refresh(): Promise<void> {
    try {
      const snap = await this.chrome.load();
      this._alerts.set(snap.alerts.map((row) => this.toAlert(row)));
    } catch {
      this._alerts.set([]);
      this.chrome.completeness.set(null);
    }
  }

  async dismiss(alert: ErpAlert): Promise<void> {
    this._alerts.update((rows) => rows.filter((a) => a.id !== alert.id));
    try {
      await this.dismissalApi.dismiss(alert.id);
    } catch {
      await this.refresh();
    }
  }

  navigate(alert: ErpAlert): void {
    void this.router.navigateByUrl(alert.route);
  }

  /** Poll live alerts while SSE is unavailable or as a fallback. */
  startPolling(intervalMs = 300_000): void {
    if (this.pollTimer != null) {
      return;
    }
    this.pollTimer = setInterval(() => {
      void this.refresh();
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollTimer != null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private toAlert(row: ChromeAlertDto): ErpAlert {
    const titre = row.titreKey
      ? this.translate.instant(row.titreKey, row.titreParams ?? {})
      : (row.titre ?? '');
    return {
      id: row.id,
      type: row.type,
      titre,
      detail: row.detail,
      urgence: row.urgence,
      route: row.route,
      date: row.date,
    };
  }
}
