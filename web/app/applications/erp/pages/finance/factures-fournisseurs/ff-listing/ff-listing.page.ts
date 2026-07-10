import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy/components';
import { DateLocalizedPipe } from '@lib/anatomy/pipes';
import { FfApiService } from '@applications/erp/pages/achats/factures-fournisseur/services/ff-api.service';
import { FF_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import type { FactureFournisseur, FactureFournStatus } from '@applications/erp/finance/models';
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-ff-listing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    DateLocalizedPipe,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header
        [config]="{
          title: t('finance.factureFournisseur.title'),
          subtitle: t('finance.factureFournisseur.subtitle'),
          breadcrumbs: [
            { label: t('finance.module.shortTitle'), route: '/finance/journaux' },
            { label: t('finance.factureFournisseur.title') }
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
            <option value="BROUILLON">{{ FF_STATUS_KEYS.BROUILLON | translate }}</option>
            <option value="VALIDEE">{{ FF_STATUS_KEYS.VALIDEE | translate }}</option>
            <option value="PARTIELLEMENT_PAYEE">{{ FF_STATUS_KEYS.PARTIELLEMENT_PAYEE | translate }}</option>
            <option value="PAYEE">{{ FF_STATUS_KEYS.PAYEE | translate }}</option>
            <option value="EN_LITIGE">{{ FF_STATUS_KEYS.EN_LITIGE | translate }}</option>
          </select>
        </label>
        <div class="chips">
          <nf-button variant="ghost" [active]="chip() === 'A_VALIDER'" (clicked)="toggleChip('A_VALIDER')">{{ 'finance.common.actions.validate' | translate }}</nf-button>
          <nf-button variant="ghost" [active]="chip() === 'A_PAYER'" (clicked)="toggleChip('A_PAYER')">{{ FF_STATUS_KEYS.PAYEE | translate }}</nf-button>
          <nf-button variant="ghost" [active]="chip() === 'EN_RETARD'" (clicked)="toggleChip('EN_RETARD')">{{ 'finance.recouvrement.headers.joursRetard' | translate }}</nf-button>
          <nf-button variant="ghost" [active]="chip() === 'EN_LITIGE'" (clicked)="toggleChip('EN_LITIGE')">{{ FF_STATUS_KEYS.EN_LITIGE | translate }}</nf-button>
          <nf-button variant="ghost" [active]="chip() === 'SANS_BC'" (clicked)="toggleChip('SANS_BC')">{{ 'finance.factureFournisseur.matching.bc' | translate }}</nf-button>
        </div>
        <a routerLink="/finance/factures-fournisseurs/new" class="btn-primary">{{ 'finance.factureFournisseur.list.emptyState.actionLabel' | translate }}</a>
      </section>

      @if (loading()) {
        <div class="loading">{{ 'finance.common.labels.loading' | translate }}</div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'finance.factureFournisseur.list.columns.numeroInterne' | translate }}</th>
                <th>{{ 'finance.factureFournisseur.list.columns.numeroFournisseur' | translate }}</th>
                <th>{{ 'finance.factureFournisseur.list.columns.fournisseur' | translate }}</th>
                <th>{{ 'finance.factureFournisseur.list.columns.dateFacture' | translate }}</th>
                <th>{{ 'finance.factureFournisseur.list.columns.dateEcheance' | translate }}</th>
                <th class="num">{{ 'finance.factureFournisseur.list.columns.totalTtc' | translate }}</th>
                <th class="num">{{ 'finance.factureFournisseur.list.columns.cumulRegle' | translate }}</th>
                <th class="num">{{ 'finance.factureFournisseur.list.columns.resteARegler' | translate }}</th>
                <th>{{ 'finance.factureFournisseur.list.columns.status' | translate }}</th>
                <th>{{ 'finance.recouvrement.headers.joursRetard' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (f of filtered(); track f.id) {
                <tr [routerLink]="['/finance/factures-fournisseurs', f.id]">
                  <td><strong>{{ f.numeroInterne }}</strong></td>
                  <td>{{ f.numeroFournisseur }}</td>
                  <td>{{ f.fournisseurName }}</td>
                  <td>{{ f.dateFacture | dateLocalized }}</td>
                  <td>{{ f.dateEcheance | dateLocalized }}</td>
                  <td class="num">{{ fmt(f.totalTtc) }}</td>
                  <td class="num">{{ fmt(f.cumulRegleTtc) }}</td>
                  <td class="num"
                    [class.zero]="f.resteARegler <= 0"
                    [class.due]="f.resteARegler > 0">
                    {{ fmt(f.resteARegler) }}
                  </td>
                  <td>
                    <span class="status status--{{ f.status }}">
                      {{ FF_STATUS_KEYS[f.status] | translate }}
                    </span>
                  </td>
                  <td>
                    @if (delaiRetard(f); as r) {
                      <span class="retard"
                        [class.retard--ok]="r <= 0"
                        [class.retard--warn]="r > 0 && r <= 7"
                        [class.retard--mid]="r > 7 && r <= 30"
                        [class.retard--bad]="r > 30">
                        {{ r > 0 ? '+' + r + 'j' : 'OK' }}
                      </span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="10" class="empty">{{ 'finance.factureFournisseur.list.emptyState.message' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="footer">
          <span>{{ filtered().length }} {{ 'finance.factureFournisseur.entityNamePlural' | translate }}</span>
          <span>{{ 'finance.factureFournisseur.list.columns.totalTtc' | translate }} : <strong>{{ fmt(totals().ttc) }}</strong></span>
          <span>{{ 'finance.factureFournisseur.recap.resteARegler' | translate }} : <strong>{{ fmt(totals().reste) }}</strong></span>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .filters { display: flex; gap: 12px; align-items: center; margin: 8px 0 16px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 280px; padding: 8px 12px; border: 1px solid var(--nf-color-primary-200); border-radius: 6px; font-size: 13px; }
    .filters select { padding: 8px 10px; border: 1px solid var(--nf-color-primary-200); border-radius: 6px; background: white; font-size: 13px; }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .chips button {
      padding: 6px 12px; border: 1px solid var(--nf-color-primary-200); background: white; border-radius: 999px;
      cursor: pointer; font-size: 12px; color: var(--nf-color-text-secondary);
    }
    .chips button.active { background: var(--nf-color-primary-700); color: white; border-color: var(--nf-color-primary-700); }
    .btn-primary {
      padding: 8px 14px; background: var(--nf-color-primary-700); color: white; border: none; border-radius: 6px;
      cursor: pointer; font-weight: 600; text-decoration: none; margin-left: auto;
    }
    .loading { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .table-wrap { background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; border-bottom: 1px solid var(--nf-color-border); white-space: nowrap; }
    th.num { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: var(--nf-color-bg-subtle); }
    .zero { color: var(--nf-color-success-600); }
    .due { color: var(--nf-color-warning-700); font-weight: 600; }
    .status { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .status--BROUILLON { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .status--VALIDEE { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .status--PARTIELLEMENT_PAYEE { background: var(--nf-color-primary-100); color: var(--nf-color-primary-800); }
    .status--PAYEE { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .status--EN_LITIGE { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .status--AVOIRISEE { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .status--ANNULEE { background: var(--nf-color-bg-muted); color: var(--nf-color-text-muted); }
    .retard { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .retard--ok { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .retard--warn { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .retard--mid { background: var(--nf-color-warning-200); color: var(--nf-color-warning-700); }
    .retard--bad { background: var(--nf-color-danger-200); color: var(--nf-color-danger-800); }
    .empty { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .footer {
      display: flex; gap: 24px; padding: 12px 16px; align-items: center; font-size: 13px;
      background: var(--nf-color-bg-subtle); margin-top: 12px; border-radius: 8px; border: 1px solid var(--nf-color-border);
    }
  `],
})
export class FfListingPage {
  private readonly ffApi = inject(FfApiService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });

  readonly FF_STATUS_KEYS = FF_STATUS_KEYS;

  readonly factures = signal<FactureFournisseur[]>([]);
  readonly loading = signal(true);

  readonly search = signal('');
  readonly filterStatus = signal<string>('');
  readonly chip = signal<string>('');

  readonly filtered = computed(() => {
    const term = this.search().toLowerCase();
    const status = this.filterStatus();
    const ch = this.chip();
    const today = todayIso();

    return this.factures().filter((f) => {
      if (status && f.status !== status) return false;
      if (term) {
        const hay = `${f.numeroInterne} ${f.numeroFournisseur} ${f.fournisseurName ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (ch === 'A_VALIDER' && f.status !== 'BROUILLON') return false;
      if (ch === 'A_PAYER' && !(f.status === 'VALIDEE' || f.status === 'PARTIELLEMENT_PAYEE')) return false;
      if (ch === 'EN_LITIGE' && f.status !== 'EN_LITIGE') return false;
      if (ch === 'SANS_BC' && !!f.bcId) return false;
      if (ch === 'EN_RETARD') {
        if (f.resteARegler <= 0) return false;
        if (f.dateEcheance >= today) return false;
      }
      return true;
    });
  });

  readonly totals = computed(() => {
    const rows = this.filtered();
    return {
      ttc: rows.reduce((s, r) => s + r.totalTtc, 0),
      reste: rows.reduce((s, r) => s + r.resteARegler, 0),
    };
  });

  constructor() {
    this.refresh();
  }

  t(key: string): string {
    return this.translate.instant(key);
  }

  refresh(): void {
    this.loading.set(true);
    void this.ffApi
      .listAll()
      .then((rows) => {
        this.factures.set(rows.sort((a, b) => b.dateFacture.localeCompare(a.dateFacture)));
      })
      .catch(() => this.factures.set([]))
      .finally(() => this.loading.set(false));
  }

  toggleChip(name: string): void {
    this.chip.set(this.chip() === name ? '' : name);
  }

  delaiRetard(f: FactureFournisseur): number {
    if (f.resteARegler <= 0) return 0;
    const today = new Date();
    const due = new Date(f.dateEcheance);
    return Math.floor((today.getTime() - due.getTime()) / 86400000);
  }

  fmt(n: number): string {
    return this.formatter.format(Math.round(n));
  }
}
