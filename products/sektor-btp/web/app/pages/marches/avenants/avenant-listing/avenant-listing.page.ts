import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { AVENANT_STATUS_KEYS, AVENANT_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { AvenantApiService } from '../services/avenant-api.service';
import { type Avenant, type AvenantStatus } from '../../models';

const STATUS_VARIANT: Record<AvenantStatus, string> = {
  BROUILLON: 'secondary', PROPOSE: 'warning', SIGNE: 'success', REJETE: 'danger',
};

@Component({
  selector: 'app-avenant-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, FilterResetComponent, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: 'marches.avenant.listing.title' | translate,
        subtitle: 'marches.avenant.listing.subtitle' | translate,
        breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.avenant.listing.breadcrumb' | translate) }]
      }"></nf-page-header>

      <div class="toolbar">
        <input class="search" type="search" [attr.placeholder]="'marches.avenant.listing.search.placeholder' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'marches.common.filters.allStatuses' | translate }}</option>
          @for (s of statusOptions; track s) { <option [value]="s">{{ AVENANT_STATUS_KEYS[s] | translate }}</option> }
        </select>
        <span class="count">{{ 'marches.avenant.listing.count' | translate:{ count: filtered().length } }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'marches.avenant.listing.columns.numero' | translate }}</th>
            <th>{{ 'marches.avenant.listing.columns.marche' | translate }}</th>
            <th>{{ 'marches.avenant.listing.columns.type' | translate }}</th>
            <th>{{ 'marches.avenant.listing.columns.objet' | translate }}</th>
            <th class="num">{{ 'marches.avenant.listing.columns.montantHt' | translate }}</th>
            <th>{{ 'marches.avenant.listing.columns.delaiPlus' | translate }}</th>
            <th>{{ 'marches.avenant.listing.columns.signature' | translate }}</th>
            <th>{{ 'marches.avenant.listing.columns.statut' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (a of filtered(); track a.id) {
              <tr class="clickable" [routerLink]="['/marches/avenants', a.id]">
                <td><strong class="code">{{ a.numero }}</strong></td>
                <td><a [routerLink]="['/marches/contrats', a.marcheId]" class="link" (click)="$event.stopPropagation()">{{ a.marcheNumero }}</a></td>
                <td class="type-sm">{{ AVENANT_TYPE_KEYS[a.type] | translate }}</td>
                <td class="objet">{{ a.objet }}</td>
                <td class="num" [class.positive]="a.montantHt > 0" [class.negative]="a.montantHt < 0">
                  {{ a.montantHt !== 0 ? (a.montantHt > 0 ? '+' : '') : '' }}{{ a.montantHt | mad }}
                </td>
                <td>{{ a.prolongationJours > 0 ? ('marches.avenant.listing.delaiJoursPlus' | translate:{ count: a.prolongationJours }) : '—' }}</td>
                <td class="date">{{ (a.dateSignature ?? '—') | date:'dd/MM/yy' }}</td>
                <td><span class="badge badge--{{ statusVariant(a.status) }}">{{ AVENANT_STATUS_KEYS[a.status] | translate }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="empty">{{ 'marches.avenant.listing.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 320px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 300px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 9px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.objet { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    td.type-sm, td.date { font-size: 12px; white-space: nowrap; color: var(--nf-color-text-secondary); }
    .code { color: var(--nf-color-primary-700); font-weight: 600; }
    .link { color: var(--nf-color-primary-600); text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }
    .positive { color: var(--nf-color-success-700); } .negative { color: var(--nf-color-danger-700); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
    tr.clickable { cursor: pointer; transition: background 80ms; }
    tr.clickable:hover { background: var(--nf-color-bg-subtle); }
  `],
})
export class AvenantListingPage implements OnInit {
  private readonly api = inject(AvenantApiService);
  private readonly toast = inject(ToastService);

  readonly AVENANT_STATUS_KEYS = AVENANT_STATUS_KEYS;
  readonly AVENANT_TYPE_KEYS = AVENANT_TYPE_KEYS;

  readonly avenants = signal<Avenant[]>([]);

  readonly search = signal('');
  readonly filterStatus = signal<AvenantStatus | ''>('');
  readonly statusOptions = Object.keys(AVENANT_STATUS_KEYS) as AvenantStatus[];

  ngOnInit(): void {
    void this.loadAvenants();
  }

  private async loadAvenants(): Promise<void> {
    try {
      const res = await this.api.getAll();
      this.avenants.set(res.items);
    } catch {
      this.avenants.set([]);
      this.toast.error('Impossible de charger les avenants.');
    }
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const st = this.filterStatus();
    let all = this.avenants();
    if (st) all = all.filter(a => a.status === st);
    if (!q) return all;
    return all.filter(a => a.numero.toLowerCase().includes(q) || a.marcheNumero.toLowerCase().includes(q) || a.objet.toLowerCase().includes(q));
  });

  statusVariant(s: AvenantStatus): string { return STATUS_VARIANT[s] ?? 'secondary'; }
  readonly hasFilter = computed(() => !!this.search() || !!this.filterStatus());

  resetFilters(): void {
    this.search.set('');
    this.filterStatus.set('');
  }
}
