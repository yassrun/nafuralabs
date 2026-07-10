import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import {
  buildRouteBreadcrumbs,
  ButtonComponent,
  ConfigDrivenListingPageStyles,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
} from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { SousTraitanceApiService } from '../services/sous-traitance-api.service';
import type { ContratSousTraitance, ContratSousTraitanceStatus } from '../models';
import { SOUS_TRAITANCE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

const STATUS_CSS: Record<ContratSousTraitanceStatus, string> = {
  BROUILLON: 'badge--secondary',
  SIGNE: 'badge--info',
  EN_COURS: 'badge--success',
  TERMINE: 'badge--secondary',
  RESILIE: 'badge--danger',
};

type StatusFilter = 'ALL' | ContratSousTraitanceStatus;

@Component({
  selector: 'app-sous-traitance-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageShellComponent,
    PageHeaderComponent,
    MadCurrencyPipe,
    FilterResetComponent,
    ButtonComponent,
    TranslateModule,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="toolbar">
        <div class="toolbar__search">
          <input
            class="search"
            type="search"
            [placeholder]="'chantiers.sousTraitance.list.searchPlaceholder' | translate"
            [value]="search()"
            (input)="search.set($any($event.target).value)"
          />
        </div>
        <nf-button variant="primary" iconLibrary="lucide" icon="plus" (clicked)="onCreate()">
          {{ 'chantiers.sousTraitance.list.createCta' | translate }}
        </nf-button>
        <span class="count">{{ countLabel() }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
      </div>

      <div class="status-chips chips-row" role="tablist" [attr.aria-label]="'chantiers.sousTraitance.list.filterByStatus' | translate">
        @for (chip of statusChips(); track chip.id) {
          <nf-button
            class="chip-btn"
            size="sm"
            [variant]="statusFilter() === chip.id ? 'primary' : 'secondary'"
            (clicked)="statusFilter.set(chip.id)"
            role="tab"
            [attr.aria-selected]="statusFilter() === chip.id">
            {{ chip.label }}
          </nf-button>
        }
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>N° contrat</th>
              <th>{{ 'chantiers.sousTraitance.list.columns.sousTraitant' | translate }}</th>
              <th>ICE</th>
              <th>Chantier</th>
              <th>Objet</th>
              <th class="num">{{ 'chantiers.sousTraitance.list.columns.montantHt' | translate }}</th>
              <th>RG</th>
              <th class="center">Avancement</th>
              <th>{{ 'chantiers.sousTraitance.list.columns.debut' | translate }}</th>
              <th>Fin</th>
              <th>Statut</th>
              <th>Art. 187</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr>
                <td><strong class="code">{{ c.numero }}</strong></td>
                <td>{{ c.sousTraitantNom }}</td>
                <td class="mono">{{ c.ice ?? '—' }}</td>
                <td><strong>{{ c.chantierCode }}</strong></td>
                <td class="objet">{{ c.objet }}</td>
                <td class="num">{{ c.montantHt | mad }}</td>
                <td>{{ c.retenueGarantieTaux }}%</td>
                <td class="center">
                  <div class="progress-wrap">
                    <div class="progress-bar"><div class="progress-fill" [style.width.%]="c.avancementPercent"></div></div>
                    <span>{{ c.avancementPercent }}%</span>
                  </div>
                </td>
                <td class="date">{{ c.dateDebut | date: 'dd/MM/yy' }}</td>
                <td class="date">{{ c.dateFin | date: 'dd/MM/yy' }}</td>
                <td><span class="badge {{ statusCss(c.status) }}">{{ statusLabel(c.status) }}</span></td>
                <td class="center">
                  @if (c.declarationArt187) {
                    <span class="check">✓</span>
                  } @else {
                    <span class="miss">—</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="12" class="empty">{{ 'chantiers.sousTraitance.list.emptyState' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [
    ConfigDrivenListingPageStyles,
    `
      :host {
        display: block;
        height: 100%;
      }
      .toolbar {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }
      .toolbar__search {
        flex: 1;
        min-width: 180px;
      }
      .search {
        width: 100%;
        max-width: 420px;
        padding: 7px 12px;
        border: 1px solid var(--nf-color-border);
        border-radius: 6px;
        font-size: 13px;
      }
      .count {
        font-size: 13px;
        color: var(--nf-color-text-secondary);
      }
      .status-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 14px;
      }
      .table-wrap {
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        overflow: auto;
        max-height: calc(100vh - 300px);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      th {
        position: sticky;
        top: 0;
        padding: 10px 12px;
        background: var(--nf-color-bg-subtle);
        color: var(--nf-color-text-secondary);
        font-weight: 600;
        text-align: left;
        border-bottom: 2px solid var(--nf-color-border);
        white-space: nowrap;
        z-index: 1;
      }
      th.num {
        text-align: right;
      }
      th.center {
        text-align: center;
      }
      td {
        padding: 9px 12px;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        color: var(--nf-color-text-primary);
      }
      td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      td.center {
        text-align: center;
      }
      td.objet {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      td.date {
        white-space: nowrap;
        color: var(--nf-color-text-secondary);
        font-size: 12px;
      }
      td.mono {
        font-variant-numeric: tabular-nums;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .code {
        color: var(--nf-color-primary-700);
      }
      .progress-wrap {
        display: flex;
        align-items: center;
        gap: 5px;
        justify-content: center;
        font-size: 11px;
        color: var(--nf-color-text-secondary);
      }
      .progress-bar {
        width: 48px;
        height: 5px;
        background: var(--nf-color-border);
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: var(--nf-color-primary-500);
        border-radius: 3px;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }
      .badge--info {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-700);
      }
      .badge--success {
        background: var(--nf-color-success-50, #dcfce7);
        color: var(--nf-color-success-700);
      }
      .badge--danger {
        background: var(--nf-color-danger-50);
        color: var(--nf-color-danger-700);
      }
      .badge--secondary {
        background: var(--nf-color-bg-muted);
        color: var(--nf-color-text-secondary);
      }
      .check {
        color: var(--nf-color-success-600);
        font-weight: 700;
      }
      .miss {
        color: var(--nf-color-text-muted);
      }
      .empty {
        text-align: center;
        padding: 2rem;
        color: var(--nf-color-text-muted);
      }
    `,
  ],
})
export class SousTraitanceListingPage {
  private readonly service = inject(SousTraitanceApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');
  private readonly _all = signal<ContratSousTraitance[]>([]);

  readonly statusChips = computed<{ id: StatusFilter; label: string }[]>(() => {
    const trEnum = (status: ContratSousTraitanceStatus): string => {
      const key = SOUS_TRAITANCE_STATUS_KEYS[status];
      const resolved = this.translate.instant(key);
      return resolved === key ? String(status) : resolved;
    };
    return [
      { id: 'ALL', label: 'Tous' },
      { id: 'BROUILLON', label: trEnum('BROUILLON') },
      { id: 'SIGNE', label: trEnum('SIGNE') },
      { id: 'EN_COURS', label: trEnum('EN_COURS') },
      { id: 'TERMINE', label: trEnum('TERMINE') },
      { id: 'RESILIE', label: trEnum('RESILIE') },
    ];
  });

  readonly headerConfig = computed(() => {
    const crumbs = buildRouteBreadcrumbs(this.route);
    return {
      title: this.translate.instant('chantiers.sousTraitance.title'),
      subtitle: 'Contrats sous-traitants chantiers',
      breadcrumbs:
        crumbs.length > 0
          ? crumbs
          : [
              { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
              { label: this.translate.instant('chantiers.routes.sousTraitanceCrumb') },
            ],
    };
  });

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const st = this.statusFilter();
    const all = this._all();
    let rows = all;
    if (st !== 'ALL') {
      rows = rows.filter((c) => c.status === st);
    }
    if (!q) return rows;
    return rows.filter(
      (c) =>
        c.numero.toLowerCase().includes(q) ||
        c.sousTraitantNom.toLowerCase().includes(q) ||
        c.chantierCode.toLowerCase().includes(q) ||
        c.objet.toLowerCase().includes(q) ||
        (c.ice ?? '').toLowerCase().includes(q),
    );
  });

  readonly countLabel = computed(() => {
    const n = this.filtered().length;
    return n <= 1 ? `${n} contrat` : `${n} contrats`;
  });

  readonly hasFilter = computed(() => !!this.search().trim() || this.statusFilter() !== 'ALL');

  constructor() {
    void this.service.getAll().then(
      (res) => this._all.set(res.items),
      () => this.toast.error('Impossible de charger les contrats sous-traitance.'),
    );
  }

  statusLabel(s: ContratSousTraitanceStatus): string {
    const key = SOUS_TRAITANCE_STATUS_KEYS[s];
    if (!key) return s;
    const resolved = this.translate.instant(key);
    return resolved === key ? s : resolved;
  }

  statusCss(s: ContratSousTraitanceStatus): string {
    return STATUS_CSS[s] ?? 'badge--secondary';
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('ALL');
  }

  onCreate(): void {
    void this.router.navigate(['/chantiers/sous-traitance/new']);
  }
}
