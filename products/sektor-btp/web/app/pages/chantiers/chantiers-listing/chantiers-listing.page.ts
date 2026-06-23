import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import { PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import type { Chantier, ChantierStatus } from '@applications/erp/chantiers/models';
import { ChantierApiService } from '../services/chantier-api.service';
import {
  CHANTIER_STATUS_KEYS,
  CHANTIER_TYPE_KEYS,
} from '@applications/erp/shell/i18n-labels';

const STATUS_CSS: Record<ChantierStatus, string> = {
  PROSPECT: 'info',
  EN_COURS: 'success',
  SUSPENDU: 'warning',
  TERMINE: 'info',
  RECEPTIONNE: 'success',
  CLOTURE: 'secondary',
  ANNULE: 'danger',
};

@Component({
  selector: 'app-chantiers-listing',
  standalone: true,
  imports: [CommonModule, PageShellComponent, PageHeaderComponent, FilterResetComponent, ButtonComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="toolbar">
        <input
          class="search"
          type="search"
          [placeholder]="'chantiers.chantier.list.searchPlaceholder' | translate"
          [value]="search()"
          (input)="search.set($any($event.target).value)" />
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'chantiers.common.filters.allStatuses' | translate }}</option>
          @for (s of allStatuses; track s) {
            <option [value]="s">{{ statusLabel(s) }}</option>
          }
        </select>
        <span class="count">{{ countLabel() }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-button variant="secondary" class="toolbar__planning" (clicked)="router.navigate(['/chantiers/planning'])">
          {{ 'chantiers.common.actions.voirPlanning' | translate }}
        </nf-button>
        <nf-button variant="primary" (clicked)="router.navigate(['/chantiers/new'])">
          {{ 'chantiers.chantier.create.cta' | translate }}
        </nf-button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'chantiers.chantier.list.columns.code' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.name' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.type' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.client' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.ville' | translate }}</th>
              <th class="num">{{ 'chantiers.chantier.list.columns.budgetHt' | translate }}</th>
              <th class="center">{{ 'chantiers.chantier.list.columns.avancement' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.status' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.dateDebut' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.dateFinPrevue' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr (click)="open(c)">
                <td><strong class="code">{{ c.code }}</strong></td>
                <td class="name">{{ c.name }}</td>
                <td class="type">{{ typeLabel(c.type) }}</td>
                <td>{{ c.clientName ?? '—' }}</td>
                <td>{{ c.ville }}</td>
                <td class="num">{{ fmtBudget(c.budgetHt) }}</td>
                <td class="center">
                  <div class="progress-wrap">
                    <div class="progress-bar">
                      <div class="progress-fill"
                        [style.width.%]="c.avancementPercent"
                        [class.progress-fill--warn]="c.status === 'SUSPENDU'"
                        [class.progress-fill--done]="c.avancementPercent >= 100">
                      </div>
                    </div>
                    <span class="pct">{{ c.avancementPercent }}%</span>
                  </div>
                </td>
                <td>
                  <span class="badge badge--{{ statusCss(c.status) }}">{{ statusLabel(c.status) }}</span>
                </td>
                <td class="date">{{ c.dateDebut | date:'dd/MM/yy' }}</td>
                <td class="date">{{ c.dateFinPrevue | date:'dd/MM/yy' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="10" class="empty">
                  @if (isEmptyTenant()) {
                    <p class="empty__title">{{ 'chantiers.chantier.list.emptyFirstTitle' | translate }}</p>
                    <p class="empty__hint">{{ 'chantiers.chantier.list.emptyFirstHint' | translate }}</p>
                    <nf-button variant="primary" class="empty__cta" (clicked)="router.navigate(['/chantiers/new'])">
                      {{ 'chantiers.chantier.create.cta' | translate }}
                    </nf-button>
                  } @else {
                    {{ 'chantiers.chantier.list.emptyState' | translate }}
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .toolbar {
      display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;
    }
    .search {
      flex: 1; min-width: 180px; max-width: 280px;
      padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px;
    }
    select {
      padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px;
      font-size: 13px; background: var(--nf-color-surface); cursor: pointer;
    }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .toolbar__planning { margin-left: auto; }

    .table-wrap {
      background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px;
      overflow: auto; max-height: calc(100vh - 300px);
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-subtle);
      color: var(--nf-color-text-secondary); font-weight: 600; text-align: left;
      border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1;
    }
    th.num { text-align: right; }
    th.center { text-align: center; }
    td { padding: 9px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.center { text-align: center; }
    td.name { font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    td.type { white-space: nowrap; }
    .code { color: var(--nf-color-primary-700); }
    tbody tr { cursor: pointer; transition: background 80ms; }
    tbody tr:hover { background: var(--nf-color-bg-subtle); }

    .progress-wrap { display: flex; align-items: center; gap: 6px; justify-content: center; }
    .progress-bar { width: 56px; height: 6px; background: var(--nf-color-border); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--nf-color-primary-500); border-radius: 3px; transition: width 0.3s; }
    .progress-fill--warn { background: var(--nf-color-warning-500); }
    .progress-fill--done { background: var(--nf-color-success-600); }
    .pct { font-size: 12px; color: var(--nf-color-text-secondary); min-width: 32px; }

    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 11px; font-weight: 600; white-space: nowrap;
    }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger  { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--info    { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }

    .empty { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .empty__title { margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--nf-color-text-primary); }
    .empty__hint { margin: 0 0 16px; font-size: 13px; color: var(--nf-color-text-secondary); }
    .empty__cta { margin: 0 auto; display: inline-block; }
  `],
})
export class ChantiersListingPage {
  protected readonly router = inject(Router);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);
  private readonly fmt = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });

  readonly allStatuses: ChantierStatus[] = [
    'EN_COURS', 'PROSPECT', 'SUSPENDU', 'TERMINE', 'RECEPTIONNE', 'CLOTURE', 'ANNULE',
  ];

  readonly search = signal('');
  readonly filterStatus = signal<ChantierStatus | ''>('');

  private readonly _all = signal<Chantier[]>([]);

  readonly headerConfig = {
    title: this.translate.instant('chantiers.chantier.list.headerTitle'),
    subtitle: this.translate.instant('chantiers.chantier.list.headerSubtitle'),
    breadcrumbs: [{ label: this.translate.instant('chantiers.routes.chantiersCrumb') }],
  };

  readonly filtered = computed(() => {
    let list = this._all();
    const q = this.search().toLowerCase().trim();
    const st = this.filterStatus();
    if (q) list = list.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.clientName ?? '').toLowerCase().includes(q) ||
      c.ville.toLowerCase().includes(q),
    );
    if (st) list = list.filter(c => c.status === st);
    return list;
  });

  readonly countLabel = computed(() => {
    const n = this.filtered().length;
    const key = n <= 1 ? 'chantiers.chantier.list.countOne' : 'chantiers.chantier.list.countOther';
    return this.translate.instant(key, { count: n });
  });

  constructor() {
    void this.chantierApi.getAll().then((res) => this._all.set(res.items));
  }

  open(c: Chantier): void {
    this.router.navigate(['/chantiers', c.id]);
  }

  statusLabel(s: ChantierStatus | string): string {
    const key = CHANTIER_STATUS_KEYS[s as ChantierStatus];
    if (!key) return String(s);
    const resolved = this.translate.instant(key);
    return resolved === key ? String(s) : resolved;
  }

  statusCss(s: ChantierStatus): string {
    return STATUS_CSS[s] ?? 'secondary';
  }

  typeLabel(t: string): string {
    const key = CHANTIER_TYPE_KEYS[t as keyof typeof CHANTIER_TYPE_KEYS];
    if (!key) return t;
    const resolved = this.translate.instant(key);
    return resolved === key ? t : resolved;
  }

  fmtBudget(n: number): string {
    if (!n) return '—';
    if (n >= 1_000_000) return `${this.fmt.format(Math.round(n / 1_000_000))} M`;
    return `${this.fmt.format(Math.round(n / 1_000))} K`;
  }
  readonly hasFilter = computed(() => !!this.search() || !!this.filterStatus());
  readonly isEmptyTenant = computed(() => this._all().length === 0);

  resetFilters(): void {
    this.search.set('');
    this.filterStatus.set('');
  }
}
