import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy/components';
import { BalanceApiService } from '@applications/erp/finance/services/balance-api.service';
import { ChantierApiService } from '@applications/erp/pages/chantiers/services/chantier-api.service';
import type {
  AxeAnalytique,
  BalanceLigne,
  BalanceTotaux,
  BalanceVue,
  CompteClasse,
} from '@applications/erp/finance/models';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header
        [config]="{
          title: t('finance.balance.title'),
          subtitle: t('finance.balance.subtitle'),
          breadcrumbs: [
            { label: t('finance.module.shortTitle'), route: '/finance/journaux' },
            { label: t('finance.balance.entityName') }
          ]
        }">
      </nf-page-header>

      <section class="filters">
        <label>
          <span>{{ 'finance.common.filters.from' | translate }}</span>
          <input type="date" [ngModel]="dateDebut()" (ngModelChange)="dateDebut.set($event); refresh()" />
        </label>
        <label>
          <span>{{ 'finance.common.filters.to' | translate }}</span>
          <input type="date" [ngModel]="dateFin()" (ngModelChange)="dateFin.set($event); refresh()" />
        </label>
        <label>
          <span>{{ 'finance.balance.filters.classe' | translate }}</span>
          <select [ngModel]="filterClasse()" (ngModelChange)="onClasseChange($event)">
            <option [ngValue]="null">{{ 'finance.common.labels.all' | translate }}</option>
            @for (c of [1, 2, 3, 4, 5, 6, 7]; track c) {
              <option [value]="c">{{ ('finance.planComptable.cgnc.classe' + c) | translate }}</option>
            }
          </select>
        </label>
        <label>
          <span>{{ 'finance.analytique.filters.axe' | translate }}</span>
          <select [ngModel]="filterAxe()" (ngModelChange)="filterAxe.set($event); refresh()">
            <option value="">{{ 'finance.common.labels.all' | translate }}</option>
            @for (a of axes(); track a.id) {
              <option [value]="a.id">{{ a.libelle }}</option>
            }
          </select>
        </label>

        <div class="vue-toggle">
          <nf-button variant="ghost" [active]="vue() === 'GENERALE'" (clicked)="setVue('GENERALE')">{{ 'finance.planComptable.type.GENERAL' | translate }}</nf-button>
          <nf-button variant="ghost" [active]="vue() === 'AUX_CLIENTS'" (clicked)="setVue('AUX_CLIENTS')">{{ 'finance.recouvrement.headers.client' | translate }}</nf-button>
          <nf-button variant="ghost" [active]="vue() === 'AUX_FOURNISSEURS'" (clicked)="setVue('AUX_FOURNISSEURS')">{{ 'finance.factureFournisseur.form.fields.fournisseur' | translate }}</nf-button>
        </div>

        <nf-button variant="primary" class="btn-primary" (clicked)="onExport()">{{ 'finance.balance.actions.exportCsv' | translate }}</nf-button>
      </section>

      @if (loading()) {
        <div class="loading">{{ 'finance.common.labels.loading' | translate }}</div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'finance.balance.headers.code' | translate }}</th>
                <th>{{ 'finance.balance.headers.libelle' | translate }}</th>
                <th>{{ 'finance.balance.filters.classe' | translate }}</th>
                <th class="num">{{ 'finance.balance.headers.soldeOuvertureDebit' | translate }}</th>
                <th class="num">{{ 'finance.balance.headers.soldeOuvertureCredit' | translate }}</th>
                <th class="num">{{ 'finance.balance.headers.movementsDebit' | translate }}</th>
                <th class="num">{{ 'finance.balance.headers.movementsCredit' | translate }}</th>
                <th class="num">{{ 'finance.balance.headers.soldeFinalDebit' | translate }}</th>
                <th class="num">{{ 'finance.balance.headers.soldeFinalCredit' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (l of lignes(); track l.compteCode) {
                <tr (click)="onDrill(l)">
                  <td><strong>{{ l.compteCode }}</strong></td>
                  <td>{{ l.compteLibelle }}</td>
                  <td><span class="chip">{{ classeLabel(l.classe) }}</span></td>
                  <td class="num">{{ fmt(l.reportsDebit) }}</td>
                  <td class="num">{{ fmt(l.reportsCredit) }}</td>
                  <td class="num">{{ fmt(l.mouvementsDebit) }}</td>
                  <td class="num">{{ fmt(l.mouvementsCredit) }}</td>
                  <td class="num">{{ fmt(l.soldeDebit) }}</td>
                  <td class="num">{{ fmt(l.soldeCredit) }}</td>
                </tr>
              } @empty {
                <tr><td colspan="9" class="empty">{{ 'finance.balance.emptyState.message' | translate }}</td></tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">{{ 'finance.balance.totals.label' | translate }}</td>
                <td class="num">{{ fmt(totaux().reportsDebit) }}</td>
                <td class="num">{{ fmt(totaux().reportsCredit) }}</td>
                <td class="num">{{ fmt(totaux().mouvementsDebit) }}</td>
                <td class="num">{{ fmt(totaux().mouvementsCredit) }}</td>
                <td class="num">{{ fmt(totaux().soldeDebit) }}</td>
                <td class="num">{{ fmt(totaux().soldeCredit) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="footer">
          <span>{{ lignes().length }} {{ 'finance.common.filters.compte' | translate }}</span>
          @if (equilibre()) {
            <span class="ok">{{ 'finance.common.labels.debit' | translate }} = {{ 'finance.common.labels.credit' | translate }}</span>
          } @else {
            <span class="warn">{{ 'finance.common.labels.ecart' | translate }} = {{ fmt(totaux().mouvementsDebit + totaux().reportsDebit - totaux().mouvementsCredit - totaux().reportsCredit) }}</span>
          }
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .filters { display: flex; gap: 14px; align-items: end; margin-bottom: 16px; flex-wrap: wrap; }
    .filters label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--nf-color-text-secondary); }
    .filters input, .filters select { padding: 6px 10px; border: 1px solid var(--nf-color-primary-200); border-radius: 6px; font-size: 13px; background: white; }
    .vue-toggle { display: flex; }
    .vue-toggle button {
      padding: 6px 12px; border: 1px solid var(--nf-color-primary-200); background: white; cursor: pointer;
      font-size: 12px; color: var(--nf-color-text-secondary);
    }
    .vue-toggle button:first-child { border-radius: 6px 0 0 6px; }
    .vue-toggle button:last-child { border-radius: 0 6px 6px 0; }
    .vue-toggle button.active { background: var(--nf-color-primary-700); color: white; border-color: var(--nf-color-primary-700); }
    .btn-primary { padding: 8px 14px; background: var(--nf-color-success-600); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-left: auto; }
    .table-wrap { background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 360px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-primary-200); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: var(--nf-color-bg-subtle); }
    tfoot td { background: var(--nf-color-bg-muted); font-weight: 700; border-top: 2px solid var(--nf-color-primary-200); }
    .chip { display: inline-block; padding: 2px 6px; background: var(--nf-color-primary-50); color: var(--nf-color-primary-700); border-radius: 4px; font-weight: 600; font-size: 10px; }
    .empty { padding: 24px; text-align: center; color: var(--nf-color-text-muted); }
    .loading { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .footer {
      display: flex; gap: 24px; padding: 12px 16px; align-items: center; font-size: 13px;
      background: var(--nf-color-bg-subtle); margin-top: 12px; border-radius: 8px; border: 1px solid var(--nf-color-border);
    }
    .ok { color: var(--nf-color-success-600); font-weight: 600; }
    .warn { color: var(--nf-color-warning-700); font-weight: 600; }
  `],
})
export class BalancePage {
  private readonly balanceApi = inject(BalanceApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  t(key: string): string {
    return this.translate.instant(key);
  }

  readonly dateDebut = signal<string>('2026-01-01');
  readonly dateFin = signal<string>('2026-04-30');
  readonly filterClasse = signal<CompteClasse | null>(null);
  readonly filterAxe = signal<string>('');
  readonly vue = signal<BalanceVue>('GENERALE');

  readonly axes = signal<AxeAnalytique[]>([]);
  readonly lignes = signal<BalanceLigne[]>([]);
  readonly totaux = signal<BalanceTotaux>({
    reportsDebit: 0,
    reportsCredit: 0,
    mouvementsDebit: 0,
    mouvementsCredit: 0,
    soldeDebit: 0,
    soldeCredit: 0,
  });
  readonly loading = signal(true);

  readonly equilibre = computed(() => {
    const t = this.totaux();
    return Math.abs((t.reportsDebit + t.mouvementsDebit) - (t.reportsCredit + t.mouvementsCredit)) < 0.5;
  });

  constructor() {
    void this.loadChantierAxes();
    this.refresh();
  }

  private async loadChantierAxes(): Promise<void> {
    try {
      const { items } = await this.chantierApi.getAll();
      const chantierAxes: AxeAnalytique[] = items.map((c) => ({
        id: c.id,
        type: 'CHANTIER',
        code: c.code,
        libelle: c.name,
        isActive: true,
      }));
      this.axes.set(chantierAxes);
    } catch {
      this.axes.set([]);
    }
  }

  setVue(v: BalanceVue): void {
    this.vue.set(v);
    this.refresh();
  }

  onClasseChange(value: string | number | null): void {
    const parsed = value === null || value === '' ? null : Number(value);
    this.filterClasse.set(Number.isNaN(parsed) ? null : (parsed as CompteClasse | null));
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    const t0 = performance.now();
    void this.balanceApi
      .getBalance({
        dateDebut: this.dateDebut(),
        dateFin: this.dateFin(),
        classe: this.filterClasse() ?? undefined,
        axeAnalytique: this.filterAxe() || undefined,
        vue: this.vue(),
      })
      .then(({ lignes, totaux }) => {
        this.lignes.set(lignes);
        this.totaux.set(totaux);
        this.loading.set(false);
        const elapsed = Math.round(performance.now() - t0);
        if (elapsed > 800) {
          console.warn(`[Balance] calcul lent : ${elapsed}ms`);
        }
      });
  }

  onDrill(l: BalanceLigne): void {
    this.router.navigate(['/finance/journaux/ecritures'], {
      queryParams: {
        compteCode: l.compteCode,
        dateDebut: this.dateDebut(),
        dateFin: this.dateFin(),
      },
    });
  }

  onExport(): void {
    const tr = (k: string) => this.translate.instant(k);
    const rows = [
      [
        tr('finance.balance.headers.code'),
        tr('finance.balance.headers.libelle'),
        tr('finance.balance.filters.classe'),
        tr('finance.balance.headers.soldeOuvertureDebit'),
        tr('finance.balance.headers.soldeOuvertureCredit'),
        tr('finance.balance.headers.movementsDebit'),
        tr('finance.balance.headers.movementsCredit'),
        tr('finance.balance.headers.soldeFinalDebit'),
        tr('finance.balance.headers.soldeFinalCredit'),
      ],
      ...this.lignes().map((l) => [
        l.compteCode,
        l.compteLibelle,
        l.classe,
        l.reportsDebit,
        l.reportsCredit,
        l.mouvementsDebit,
        l.mouvementsCredit,
        l.soldeDebit,
        l.soldeCredit,
      ]),
      [
        tr('finance.balance.totals.label'),
        '',
        '',
        this.totaux().reportsDebit,
        this.totaux().reportsCredit,
        this.totaux().mouvementsDebit,
        this.totaux().mouvementsCredit,
        this.totaux().soldeDebit,
        this.totaux().soldeCredit,
      ],
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-${this.dateDebut()}_${this.dateFin()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success(this.translate.instant('finance.common.toasts.exportStarted'));
  }

  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });

  fmt(n: number): string {
    if (!n) return '';
    return this.formatter.format(Math.round(n));
  }

  classeLabel(c: number): string {
    return this.translate.instant(`finance.planComptable.cgnc.classe${c}`);
  }
}
