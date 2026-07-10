import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy/components';
import { JournalApiService } from '@applications/erp/finance/services/journal-api.service';
import type { JournalSummary } from '@applications/erp/finance/models';

interface PeriodOption {
  label: string;
  start: string;
  end: string;
}

function buildPeriodOptions(locale: string): PeriodOption[] {
  const months: PeriodOption[] = [];
  const start = new Date(Date.UTC(2025, 9, 1));
  const end = new Date(Date.UTC(2026, 4, 30));
  const cur = new Date(start.getTime());
  while (cur <= end) {
    const y = cur.getUTCFullYear();
    const m = cur.getUTCMonth();
    const first = new Date(Date.UTC(y, m, 1));
    const last = new Date(Date.UTC(y, m + 1, 0));
    months.push({
      label: first.toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
      start: first.toISOString().slice(0, 10),
      end: last.toISOString().slice(0, 10),
    });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return months.reverse();
}

@Component({
  selector: 'app-journal-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig">
      </nf-page-header>

      <section class="filters">
        <label class="filter">
          <span>{{ 'finance.journal.list.filters.period' | translate }}</span>
          <select [ngModel]="periodIdx()" (ngModelChange)="onPeriod($event)">
            @for (p of periods; track p.start; let i = $index) {
              <option [ngValue]="i">{{ p.label }}</option>
            }
          </select>
        </label>
        <label class="filter">
          <span>{{ 'finance.journal.list.filters.type' | translate }}</span>
          <select [ngModel]="filterType()" (ngModelChange)="filterType.set($event)">
            <option value="">{{ 'finance.common.filters.all' | translate }}</option>
            <option value="VENTE">{{ 'finance.journal.types.vente' | translate }}</option>
            <option value="ACHAT">{{ 'finance.journal.types.achat' | translate }}</option>
            <option value="BANQUE">{{ 'finance.journal.types.banque' | translate }}</option>
            <option value="CAISSE">{{ 'finance.journal.types.caisse' | translate }}</option>
            <option value="OPERATIONS_DIVERSES">{{ 'finance.journal.types.operationsDiverses' | translate }}</option>
            <option value="NOUVEAUX">{{ 'finance.journal.types.nouveaux' | translate }}</option>
          </select>
        </label>
        <nf-button variant="primary" class="btn-primary" (clicked)="onNouvelle()">{{ 'finance.ecriture.actions.create' | translate }}</nf-button>
      </section>

      @if (loading()) {
        <div class="loading">{{ 'finance.common.toasts.loading' | translate }}</div>
      } @else {
        <div class="table-wrap">
          <table class="journal-table">
            <thead>
              <tr>
                <th>{{ 'finance.journal.entityName' | translate }}</th>
                <th>{{ 'finance.journal.list.columns.code' | translate }}</th>
                <th class="num">{{ 'finance.journal.list.columns.totalDebit' | translate }}</th>
                <th class="num">{{ 'finance.journal.list.columns.totalCredit' | translate }}</th>
                <th class="num">{{ 'finance.journal.list.columns.solde' | translate }}</th>
                <th class="num">{{ 'finance.journal.list.columns.nbEcritures' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (s of filteredSummaries(); track s.journalCode) {
                <tr (click)="openEcritures(s.journalCode)">
                  <td>{{ s.journalLibelle }}</td>
                  <td><span class="chip">{{ s.journalCode }}</span></td>
                  <td class="num">{{ formatNum(s.totalDebit) }}</td>
                  <td class="num">{{ formatNum(s.totalCredit) }}</td>
                  <td class="num" [class.positive]="s.solde > 0" [class.negative]="s.solde < 0">
                    {{ formatNum(s.solde) }}
                  </td>
                  <td class="num">{{ s.nbEcritures }}</td>
                  <td class="action">
                    <span class="link">{{ 'finance.common.actions.open' | translate }}</span>
                  </td>
                </tr>
              }
              <tr class="total-row">
                <td colspan="2">{{ 'finance.common.labels.total' | translate }}</td>
                <td class="num">{{ formatNum(totals().debit) }}</td>
                <td class="num">{{ formatNum(totals().credit) }}</td>
                <td class="num">{{ formatNum(totals().solde) }}</td>
                <td class="num">{{ totals().nb }}</td>
                <td>
                  @if (totals().equilibre) {
                    <span class="badge-ok">{{ 'finance.journal.status.equilibre' | translate }}</span>
                  } @else {
                    <span class="badge-warn">{{ 'finance.journal.status.desequilibre' | translate }} {{ formatNum(totals().solde) }}</span>
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .filters { display: flex; align-items: end; gap: 16px; margin: 8px 0 16px; flex-wrap: wrap; }
    .filter { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--nf-color-text-secondary); }
    .filter select { padding: 6px 10px; border: 1px solid var(--nf-color-primary-200); border-radius: 6px; background: white; min-width: 160px; }
    .btn-primary {
      padding: 8px 14px; background: var(--nf-color-primary-700); color: white; border: none; border-radius: 6px;
      cursor: pointer; font-weight: 600; margin-left: auto;
    }
    .loading { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .table-wrap { background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: hidden; }
    .journal-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .journal-table th { text-align: left; padding: 10px 14px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; border-bottom: 1px solid var(--nf-color-border); }
    .journal-table th.num { text-align: right; }
    .journal-table td { padding: 10px 14px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .journal-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .journal-table tbody tr { cursor: pointer; }
    .journal-table tbody tr:hover { background: var(--nf-color-bg-subtle); }
    .total-row { background: var(--nf-color-bg-muted); font-weight: 600; }
    .total-row td { border-top: 2px solid var(--nf-color-primary-200); }
    .chip {
      display: inline-block; padding: 2px 8px; background: var(--nf-color-primary-50); color: var(--nf-color-primary-700);
      border-radius: 4px; font-weight: 600; font-size: 11px; letter-spacing: 0.04em;
    }
    .positive { color: var(--nf-color-success-600); }
    .negative { color: var(--nf-color-danger-600); }
    .link { color: var(--nf-color-primary-700); font-weight: 500; }
    .badge-ok { color: var(--nf-color-success-600); font-weight: 600; }
    .badge-warn { color: var(--nf-color-warning-700); font-weight: 600; }
    td.action { text-align: right; }
  `],
})
export class JournalListingPage {
  private readonly journalApi = inject(JournalApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });

  readonly headerConfig = {
    title: this.translate.instant('finance.journal.title'),
    subtitle: this.translate.instant('finance.journal.subtitle'),
  };

  readonly periods = buildPeriodOptions(this.locale);
  readonly periodIdx = signal(0);
  readonly filterType = signal<string>('');
  readonly summaries = signal<JournalSummary[]>([]);
  readonly loading = signal(true);

  readonly filteredSummaries = computed(() => {
    const type = this.filterType();
    let rows = this.summaries();
    if (type) rows = rows.filter((s) => s.type === type);
    return rows;
  });

  readonly totals = computed(() => {
    const rows = this.filteredSummaries();
    const debit = rows.reduce((s, r) => s + r.totalDebit, 0);
    const credit = rows.reduce((s, r) => s + r.totalCredit, 0);
    const nb = rows.reduce((s, r) => s + r.nbEcritures, 0);
    const solde = Math.round((debit - credit) * 100) / 100;
    return { debit, credit, solde, nb, equilibre: Math.abs(solde) < 0.01 };
  });

  constructor() {
    this.refresh();
  }

  onPeriod(idx: number): void {
    this.periodIdx.set(idx);
    this.refresh();
  }

  refresh(): void {
    const period = this.periods[this.periodIdx()];
    this.loading.set(true);
    void this.journalApi.summaries(period.start, period.end).then((rows) => {
      this.summaries.set(rows);
      this.loading.set(false);
    });
  }

  openEcritures(journalCode: string): void {
    const period = this.periods[this.periodIdx()];
    this.router.navigate(['/finance/journaux/ecritures'], {
      queryParams: {
        journalCode,
        dateDebut: period.start,
        dateFin: period.end,
      },
    });
  }

  onNouvelle(): void {
    this.router.navigate(['/finance/journaux/nouvelle']);
  }

  formatNum(n: number): string {
    return this.formatter.format(Math.round(n));
  }
}
