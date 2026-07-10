import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { FACTURE_MARCHE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { FactureMarcheApiService } from '../services/facture-marche-api.service';
import { FACTURE_STATUS_VARIANT, type FactureMarche, type FactureMarcheStatus } from '../../models';

@Component({
  selector: 'app-facture-marche-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, FilterResetComponent, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: 'marches.factureMarche.listing.title' | translate,
        subtitle: 'marches.factureMarche.listing.subtitle' | translate,
        breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.factureMarche.listing.breadcrumb' | translate) }]
      }"></nf-page-header>

      <div class="kpi-strip">
        <article class="kpi"><span>{{ 'marches.factureMarche.listing.kpis.totalEmisHt' | translate }}</span><strong>{{ totalEmisHt() | mad }}</strong></article>
        <article class="kpi"><span>{{ 'marches.factureMarche.listing.kpis.totalNetAPayer' | translate }}</span><strong>{{ totalNetAPayer() | mad }}</strong></article>
        <article class="kpi"><span>{{ 'marches.factureMarche.listing.kpis.enRetard' | translate }}</span><strong [class.danger]="enRetard() > 0">{{ enRetard() }}</strong></article>
      </div>

      <div class="toolbar">
        <input class="search" type="search" [attr.placeholder]="'marches.factureMarche.listing.search.placeholder' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'marches.common.filters.allStatuses' | translate }}</option>
          @for (s of statusOptions; track s) { <option [value]="s">{{ FACTURE_MARCHE_STATUS_KEYS[s] | translate }}</option> }
        </select>
        <span class="count">{{ 'marches.factureMarche.listing.count' | translate:{ count: filtered().length } }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'marches.factureMarche.listing.columns.numero' | translate }}</th>
            <th>{{ 'marches.factureMarche.listing.columns.marche' | translate }}</th>
            <th>{{ 'marches.factureMarche.listing.columns.client' | translate }}</th>
            <th class="num">{{ 'marches.factureMarche.listing.columns.brutHt' | translate }}</th>
            <th class="num">{{ 'marches.factureMarche.listing.columns.rg' | translate }}</th>
            <th class="num">{{ 'marches.factureMarche.listing.columns.tva' | translate }}</th>
            <th class="num">{{ 'marches.factureMarche.listing.columns.netAPayer' | translate }}</th>
            <th>{{ 'marches.factureMarche.listing.columns.emission' | translate }}</th>
            <th>{{ 'marches.factureMarche.listing.columns.echeance' | translate }}</th>
            <th>{{ 'marches.factureMarche.listing.columns.statut' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (f of filtered(); track f.id) {
              <tr [routerLink]="['/marches/factures', f.id]" class="clickable" [class.row--overdue]="isOverdue(f)">
                <td><strong class="code">{{ f.numero }}</strong></td>
                <td><a [routerLink]="['/marches/contrats', f.marcheId]" (click)="$event.stopPropagation()" class="link">{{ f.marcheNumero }}</a></td>
                <td class="client">{{ f.clientNom }}</td>
                <td class="num">{{ f.montantBrutHt | mad }}</td>
                <td class="num danger-text">−{{ f.retenueGarantieHt | mad }}</td>
                <td class="num">{{ f.tvaMontant | mad }}</td>
                <td class="num accent"><strong>{{ f.netAPayer | mad }}</strong></td>
                <td class="date">{{ f.dateEmission | date:'dd/MM/yy' }}</td>
                <td class="date" [class.overdue-date]="isOverdue(f)">{{ f.dateEcheance | date:'dd/MM/yy' }}</td>
                <td><span class="badge badge--{{ statusVariant(f.status) }}">{{ FACTURE_MARCHE_STATUS_KEYS[f.status] | translate }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="10" class="empty">{{ 'marches.factureMarche.listing.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .kpi-strip { display: flex; gap: 0.875rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .kpi { padding: 0.75rem 1.1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 160px; }
    .kpi span { display: block; font-size: 0.72rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.2rem; }
    .kpi strong { font-size: 0.95rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .kpi strong.danger { color: var(--nf-color-danger-600); }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 380px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 9px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    td.client { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .code { color: var(--nf-color-primary-700); font-weight: 600; }
    .link { color: var(--nf-color-primary-600); text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }
    .danger-text { color: var(--nf-color-danger-700); }
    .accent { color: var(--nf-color-primary-700); }
    .overdue-date { color: var(--nf-color-danger-600); font-weight: 700; }
    .clickable { cursor: pointer; transition: background 80ms; }
    .clickable:hover { background: var(--nf-color-bg-subtle); }
    .row--overdue { background: var(--nf-color-danger-50); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class FactureMarcheListingPage implements OnInit {
  private readonly api = inject(FactureMarcheApiService);
  private readonly toast = inject(ToastService);

  readonly FACTURE_MARCHE_STATUS_KEYS = FACTURE_MARCHE_STATUS_KEYS;

  readonly factures = signal<FactureMarche[]>([]);
  readonly search = signal('');
  readonly filterStatus = signal<FactureMarcheStatus | ''>('');
  readonly statusOptions = Object.keys(FACTURE_MARCHE_STATUS_KEYS) as FactureMarcheStatus[];
  readonly today = new Date('2026-05-09');

  ngOnInit(): void {
    void this.loadFactures();
  }

  private async loadFactures(): Promise<void> {
    try {
      const res = await this.api.getAll();
      this.factures.set(res.items);
    } catch {
      this.factures.set([]);
      this.toast.error('Impossible de charger les factures de marché.');
    }
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const st = this.filterStatus();
    let all = this.factures();
    if (st) all = all.filter(f => f.status === st);
    if (!q) return all;
    return all.filter(f => f.numero.toLowerCase().includes(q) || f.marcheNumero.toLowerCase().includes(q) || f.clientNom.toLowerCase().includes(q));
  });

  readonly totalEmisHt = computed(() => this.filtered().reduce((s, f) => s + f.montantBrutHt, 0));
  readonly totalNetAPayer = computed(() => this.filtered().reduce((s, f) => s + f.netAPayer, 0));
  readonly enRetard = computed(() => this.filtered().filter(f => this.isOverdue(f)).length);

  isOverdue(f: { status: FactureMarcheStatus; dateEcheance: string }): boolean {
    if (f.status === 'PAYEE' || f.status === 'BROUILLON') return false;
    return new Date(f.dateEcheance) < this.today;
  }
  statusVariant(s: FactureMarcheStatus): string { return FACTURE_STATUS_VARIANT[s] ?? 'secondary'; }
  readonly hasFilter = computed(() => !!this.search() || !!this.filterStatus());

  resetFilters(): void {
    this.search.set('');
    this.filterStatus.set('');
  }
}
