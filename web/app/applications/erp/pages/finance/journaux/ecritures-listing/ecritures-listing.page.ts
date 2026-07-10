import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy/components';
import { JournalEntryApiService } from '@applications/erp/finance/services/journal-entry-api.service';
import { DateLocalizedPipe } from '@lib/anatomy/pipes';
import { ECRITURE_ORIGINE_KEYS, ECRITURE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import type { Ecriture } from '@applications/erp/finance/models';

@Component({
  selector: 'app-ecritures-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, DateLocalizedPipe, PageShellComponent, PageHeaderComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header
        [config]="{
          title: t('finance.ecriture.title'),
          subtitle: subtitle(),
          breadcrumbs: [
            { label: t('finance.module.shortTitle'), route: '/finance/journaux' },
            { label: t('finance.journal.entityNamePlural'), route: '/finance/journaux' },
            { label: t('finance.ecriture.entityNamePlural') }
          ]
        }">
      </nf-page-header>

      <section class="filters">
        <input
          type="search"
          class="search"
          [attr.placeholder]="'finance.common.filters.searchPlaceholder' | translate"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)" />
        <label>
          <select [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event)">
            <option value="">{{ 'finance.common.filters.allStatuses' | translate }}</option>
            <option value="BROUILLON">{{ ECRITURE_STATUS_KEYS.BROUILLON | translate }}</option>
            <option value="VALIDEE">{{ ECRITURE_STATUS_KEYS.VALIDEE | translate }}</option>
            <option value="CLOTUREE">{{ ECRITURE_STATUS_KEYS.CLOTUREE | translate }}</option>
          </select>
        </label>
        <label>
          <select [ngModel]="filterOrigine()" (ngModelChange)="filterOrigine.set($event)">
            <option value="">{{ 'finance.common.filters.allStatuses' | translate }}</option>
            <option value="MANUELLE">{{ ECRITURE_ORIGINE_KEYS.MANUELLE | translate }}</option>
            <option value="AUTO">{{ 'finance.ecriture.form.fields.origine' | translate }}</option>
          </select>
        </label>
        <div class="chips">
          <nf-button variant="ghost" [active]="chip() === 'BROUILLON'" (clicked)="toggleChip('BROUILLON')">
            {{ ECRITURE_STATUS_KEYS.BROUILLON | translate }}
          </nf-button>
          <nf-button variant="ghost" [active]="chip() === 'AUTO'" (clicked)="toggleChip('AUTO')">
            {{ 'finance.ecriture.form.fields.origine' | translate }}
          </nf-button>
          <nf-button variant="ghost" [active]="chip() === 'MANUELLE'" (clicked)="toggleChip('MANUELLE')">
            {{ ECRITURE_ORIGINE_KEYS.MANUELLE | translate }}
          </nf-button>
        </div>
      </section>

      @if (loading()) {
        <div class="loading">{{ 'finance.common.labels.loading' | translate }}</div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'finance.ecriture.list.columns.numero' | translate }}</th>
                <th>{{ 'finance.ecriture.list.columns.date' | translate }}</th>
                <th>{{ 'finance.ecriture.list.columns.journal' | translate }}</th>
                <th>{{ 'finance.ecriture.list.columns.reference' | translate }}</th>
                <th>{{ 'finance.ecriture.list.columns.libelle' | translate }}</th>
                <th class="num">{{ 'finance.ecriture.list.columns.totalDebit' | translate }}</th>
                <th class="num">{{ 'finance.ecriture.list.columns.totalCredit' | translate }}</th>
                <th>{{ 'finance.ecriture.list.columns.status' | translate }}</th>
                <th>{{ 'finance.ecriture.list.columns.origine' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (ec of filtered(); track ec.id) {
                <tr [routerLink]="['/finance/journaux/ecritures', ec.id]">
                  <td><strong>{{ ec.numero }}</strong></td>
                  <td>{{ ec.dateEcriture | dateLocalized }}</td>
                  <td><span class="chip">{{ ec.journalCode }}</span></td>
                  <td>{{ ec.reference || ('finance.common.dash' | translate) }}</td>
                  <td class="lib">{{ ec.libelle }}</td>
                  <td class="num">{{ formatNum(ec.totalDebit) }}</td>
                  <td class="num">{{ formatNum(ec.totalCredit) }}</td>
                  <td>
                    <span class="status status--{{ ec.status }}">
                      {{ ECRITURE_STATUS_KEYS[ec.status] | translate }}
                    </span>
                  </td>
                  <td>
                    <span class="origine">{{ (ec.origine ? ECRITURE_ORIGINE_KEYS[ec.origine] : ECRITURE_ORIGINE_KEYS.MANUELLE) | translate }}</span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="9" class="empty">{{ 'finance.ecriture.list.emptyState.message' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="footer">
          <span>{{ filtered().length }} {{ 'finance.ecriture.entityNamePlural' | translate }}</span>
          <span>{{ 'finance.common.labels.debit' | translate }} : <strong>{{ formatNum(totals().d) }}</strong></span>
          <span>{{ 'finance.common.labels.credit' | translate }} : <strong>{{ formatNum(totals().c) }}</strong></span>
          @if (totals().equilibre) {
            <span class="ok">{{ 'finance.common.labels.balance' | translate }}</span>
          } @else {
            <span class="warn">{{ 'finance.common.labels.ecart' | translate }} {{ formatNum(totals().d - totals().c) }}</span>
          }
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .filters {
      display: flex; gap: 12px; align-items: center; margin: 8px 0 16px; flex-wrap: wrap;
    }
    .search {
      flex: 1; min-width: 280px; padding: 8px 12px; border: 1px solid var(--nf-color-primary-200);
      border-radius: 6px; font-size: 13px;
    }
    .filters select {
      padding: 8px 10px; border: 1px solid var(--nf-color-primary-200); border-radius: 6px; background: white; font-size: 13px;
    }
    .chips { display: flex; gap: 6px; }
    .chips button {
      padding: 6px 12px; border: 1px solid var(--nf-color-primary-200); background: white; border-radius: 999px;
      cursor: pointer; font-size: 12px; color: var(--nf-color-text-secondary);
    }
    .chips button.active { background: var(--nf-color-primary-700); color: white; border-color: var(--nf-color-primary-700); }
    .loading { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .table-wrap { background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; border-bottom: 1px solid var(--nf-color-border); white-space: nowrap; }
    td { padding: 10px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); vertical-align: top; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    th.num { text-align: right; }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: var(--nf-color-bg-subtle); }
    .lib { max-width: 380px; }
    .chip {
      display: inline-block; padding: 2px 8px; background: var(--nf-color-primary-50); color: var(--nf-color-primary-700);
      border-radius: 4px; font-weight: 600; font-size: 11px; letter-spacing: 0.04em;
    }
    .status { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .status--BROUILLON { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .status--VALIDEE { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .status--CLOTUREE { background: var(--nf-color-primary-100); color: var(--nf-color-primary-800); }
    .origine { font-size: 11px; color: var(--nf-color-text-secondary); }
    .empty { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .footer {
      display: flex; gap: 24px; padding: 12px 16px; align-items: center; font-size: 13px;
      background: var(--nf-color-bg-subtle); margin-top: 12px; border-radius: 8px; border: 1px solid var(--nf-color-border);
    }
    .footer .ok { color: var(--nf-color-success-600); font-weight: 600; }
    .footer .warn { color: var(--nf-color-warning-700); font-weight: 600; }
  `],
})
export class EcrituresListingPage {
  private readonly entryApi = inject(JournalEntryApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly ECRITURE_STATUS_KEYS = ECRITURE_STATUS_KEYS;
  readonly ECRITURE_ORIGINE_KEYS = ECRITURE_ORIGINE_KEYS;

  t(key: string): string {
    return this.translate.instant(key);
  }

  readonly all = signal<Ecriture[]>([]);
  readonly loading = signal(true);

  readonly journalCode = signal<string | null>(null);
  readonly dateDebut = signal<string | null>(null);
  readonly dateFin = signal<string | null>(null);

  readonly search = signal('');
  readonly filterStatus = signal<string>('');
  readonly filterOrigine = signal<string>('');
  readonly chip = signal<string>('');

  readonly filtered = computed(() => {
    const term = this.search().toLowerCase();
    const journal = this.journalCode();
    const dDeb = this.dateDebut();
    const dFin = this.dateFin();
    const status = this.filterStatus();
    const orig = this.filterOrigine();
    const ch = this.chip();
    return this.all().filter((ec) => {
      if (journal && ec.journalCode !== journal) return false;
      if (dDeb && ec.dateEcriture < dDeb) return false;
      if (dFin && ec.dateEcriture > dFin) return false;
      if (status && ec.status !== status) return false;
      if (orig === 'MANUELLE' && ec.origine !== 'MANUELLE') return false;
      if (orig === 'AUTO' && ec.origine === 'MANUELLE') return false;
      if (ch === 'BROUILLON' && ec.status !== 'BROUILLON') return false;
      if (ch === 'AUTO' && ec.origine === 'MANUELLE') return false;
      if (ch === 'MANUELLE' && ec.origine !== 'MANUELLE') return false;
      if (term) {
        const hay = `${ec.numero} ${ec.libelle} ${ec.reference ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  });

  readonly totals = computed(() => {
    const rows = this.filtered();
    const d = rows.reduce((s, r) => s + r.totalDebit, 0);
    const c = rows.reduce((s, r) => s + r.totalCredit, 0);
    return { d, c, equilibre: Math.abs(d - c) < 0.01 };
  });

  readonly subtitle = computed(() => {
    const journal = this.journalCode();
    const dDeb = this.dateDebut();
    const dFin = this.dateFin();
    const parts: string[] = [];
    if (journal) parts.push(`${this.translate.instant('finance.ecriture.list.columns.journal')} ${journal}`);
    if (dDeb && dFin) {
      const from = this.translate.instant('finance.common.filters.from');
      const to = this.translate.instant('finance.common.filters.to');
      parts.push(`${from} ${this.formatDate(dDeb)} ${to} ${this.formatDate(dFin)}`);
    }
    return parts.join(' · ');
  });

  constructor() {
    this.route.queryParams.subscribe((params) => {
      this.journalCode.set(params['journalCode'] ?? null);
      this.dateDebut.set(params['dateDebut'] ?? null);
      this.dateFin.set(params['dateFin'] ?? null);
    });
    this.loading.set(true);
    void this.entryApi.listFull().then((rows) => {
      this.all.set(rows);
      this.loading.set(false);
    });
  }

  toggleChip(name: string): void {
    this.chip.set(this.chip() === name ? '' : name);
  }

  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });

  formatNum(n: number): string {
    return this.formatter.format(Math.round(n));
  }

  formatDate(s?: string): string {
    if (!s) return this.translate.instant('finance.common.dash');
    return new Date(s).toLocaleDateString(this.locale);
  }
}
