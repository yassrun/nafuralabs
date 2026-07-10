import { Injectable, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ApprobationsApiService } from '../pages/approbations/services/approbations-api.service';
import { CautionApiService } from '../pages/marches/cautions/services/caution-api.service';
import { FactureMarcheApiService } from '../pages/marches/factures/services/facture-marche-api.service';
import { FormationApiService } from '../pages/hse/formations/services/formation-api.service';

import { ErpAlertDismissalApiService } from './erp-alert-dismissal-api.service';

export interface ErpAlert {
  id: string;
  type: 'APPROBATION' | 'FACTURE_RETARD' | 'CAUTION_EXPIRY' | 'NC_CRITIQUE' | 'PILOTAGE';
  titre: string;
  detail: string;
  urgence: 'HAUTE' | 'NORMALE';
  route: string;
  date: string;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

@Injectable({ providedIn: 'root' })
export class ErpNotificationsService {
  private readonly approbationsApi = inject(ApprobationsApiService);
  private readonly factureMarcheApi = inject(FactureMarcheApiService);
  private readonly cautionApi = inject(CautionApiService);
  private readonly formationApi = inject(FormationApiService);
  private readonly dismissalApi = inject(ErpAlertDismissalApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private dismissedKeys = new Set<string>();

  private readonly _alerts = signal<ErpAlert[]>([]);
  readonly alerts = this._alerts.asReadonly();

  readonly countHaute = computed(() => this._alerts().filter((a) => a.urgence === 'HAUTE').length);
  readonly totalCount = computed(() => this._alerts().length);

  async refresh(): Promise<void> {
    if (this.dismissedKeys.size === 0) {
      this.dismissedKeys = await this.dismissalApi.listDismissedKeys();
    }

    const today = startOfDay(new Date());
    const result: ErpAlert[] = [];

    try {
      await this.approbationsApi.ensureLoaded();
      this.approbationsApi.enAttente().forEach((a) => {
        result.push({
          id: a.id,
          type: 'APPROBATION',
          titre: `${a.entityRef} attend votre validation`,
          detail: a.entitySummary.slice(0, 100),
          urgence: a.urgence === 'HAUTE' || a.urgence === 'CRITIQUE' ? 'HAUTE' : 'NORMALE',
          route: `/approbations?highlight=${encodeURIComponent(a.id)}`,
          date: a.dateCreation,
        });
      });
    } catch {
      /* empty fallback */
    }

    try {
      const { items: factures } = await this.factureMarcheApi.getAll();
      factures
        .filter(
          (f) =>
            f.status !== 'PAYEE' &&
            f.status !== 'BROUILLON' &&
            f.dateEcheance &&
            startOfDay(new Date(f.dateEcheance)) < today,
        )
        .forEach((f) => {
          const joursRetard = Math.floor(
            (today.getTime() - startOfDay(new Date(f.dateEcheance)).getTime()) / 86400000,
          );
          result.push({
            id: `facture-${f.id}`,
            type: 'FACTURE_RETARD',
            titre: this.translate.instant('shared.alerts.factureLate', {
              numero: f.numero,
              count: joursRetard,
            }),
            detail: `Client : ${f.clientNom} — Net à payer : ${new Intl.NumberFormat(this.locale).format(f.netAPayer)} MAD`,
            urgence: joursRetard > 30 ? 'HAUTE' : 'NORMALE',
            route: `/marches/factures/${f.id}`,
            date: f.dateEcheance,
          });
        });
    } catch {
      /* empty fallback */
    }

    try {
      const cautions = await this.cautionApi.expirant(30);
      cautions.forEach((c) => {
        const daysLeft = Math.ceil(
          (startOfDay(new Date(c.dateValiditeJusquA)).getTime() - today.getTime()) / 86400000,
        );
        result.push({
          id: `caution-${c.id}`,
          type: 'CAUTION_EXPIRY',
          titre: this.translate.instant('shared.alerts.cautionExpiry', {
            numero: c.numero,
            count: daysLeft,
          }),
          detail: `${c.banqueEmettrice} — ${new Intl.NumberFormat(this.locale).format(c.montant)} MAD`,
          urgence: daysLeft <= 7 ? 'HAUTE' : 'NORMALE',
          route: `/marches/contrats/${c.marcheId}`,
          date: c.dateValiditeJusquA,
        });
      });
    } catch {
      /* empty fallback */
    }

    try {
      const formations = await this.formationApi.listExpirant(30);
      formations.slice(0, 3).forEach((f) => {
        const expiryDate = f.attestationValidite ?? f.dateFin ?? f.dateDebut;
        const daysLeft = Math.ceil(
          (startOfDay(new Date(expiryDate)).getTime() - today.getTime()) / 86400000,
        );
        result.push({
          id: `formation-${f.id}`,
          type: 'NC_CRITIQUE',
          titre: `Formation à renouveler : ${f.titre}`,
          detail: f.formateur ? `Formateur : ${f.formateur}` : 'Validité proche',
          urgence: daysLeft <= 7 ? 'HAUTE' : 'NORMALE',
          route: `/hse/formations/${f.id}`,
          date: expiryDate,
        });
      });
    } catch {
      /* empty fallback */
    }

    const sorted = result
      .filter((a) => !this.dismissedKeys.has(a.id))
      .sort((a, b) => {
        if (a.urgence !== b.urgence) return a.urgence === 'HAUTE' ? -1 : 1;
        return b.date.localeCompare(a.date);
      });

    this._alerts.set(sorted);
    void this.dismissalApi.cleanupResolved(result.map((a) => a.id));
  }

  async dismiss(alert: ErpAlert): Promise<void> {
    this.dismissedKeys.add(alert.id);
    this._alerts.update((rows) => rows.filter((a) => a.id !== alert.id));
    try {
      await this.dismissalApi.dismiss(alert.id);
    } catch {
      this.dismissedKeys.delete(alert.id);
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
}
