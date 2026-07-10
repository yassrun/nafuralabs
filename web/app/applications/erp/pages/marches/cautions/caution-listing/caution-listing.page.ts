import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { CAUTION_STATUS_KEYS, CAUTION_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { CautionApiService } from '../services/caution-api.service';
import { type CautionBancaire, type CautionStatus, type CautionType } from '../../models';

const STATUS_VARIANT: Record<CautionStatus, string> = {
  EMISE: 'info', ACTIVE: 'success', LEVEE: 'secondary', EXPIRE: 'danger', JOUE: 'danger',
};

@Component({
  selector: 'app-caution-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: 'marches.caution.listing.title' | translate,
        subtitle: 'marches.caution.listing.subtitle' | translate,
        breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.caution.listing.breadcrumb' | translate) }]
      }"></nf-page-header>

      <div class="board" [attr.aria-label]="'marches.caution.listing.board.ariaLabel' | translate">
        <section class="board__col">
          <h3 class="board__title">{{ 'marches.caution.listing.board.actives' | translate }}</h3>
          <p class="board__count">{{ actives().length }}</p>
          <ul class="board__list">
            @for (c of actives(); track c.id) {
              <li><a [routerLink]="['/marches/contrats', c.marcheId]" class="link">{{ c.numero }}</a> · {{ c.marcheNumero }}</li>
            } @empty { <li class="muted">{{ 'marches.caution.listing.board.empty' | translate }}</li> }
          </ul>
        </section>
        <section class="board__col board__col--warn">
          <h3 class="board__title">{{ 'marches.caution.listing.board.aRenouveler' | translate }}</h3>
          <p class="board__count">{{ aRenouveler().length }}</p>
          <ul class="board__list">
            @for (c of aRenouveler(); track c.id) {
              <li><span class="board__code">{{ c.numero }}</span> · {{ 'marches.caution.listing.board.finPrefix' | translate:{ date: (c.dateValiditeJusquA | date:'dd/MM/yy') } }}</li>
            } @empty { <li class="muted">{{ 'marches.caution.listing.board.emptyAlert' | translate }}</li> }
          </ul>
        </section>
        <section class="board__col board__col--muted">
          <h3 class="board__title">{{ 'marches.caution.listing.board.mainlevees' | translate }}</h3>
          <p class="board__count">{{ mainlevees().length }}</p>
          <ul class="board__list">
            @for (c of mainlevees(); track c.id) {
              <li>{{ c.numero }} · {{ c.dateLevee ? (c.dateLevee | date:'dd/MM/yy') : '—' }}</li>
            } @empty { <li class="muted">{{ 'marches.caution.listing.board.empty' | translate }}</li> }
          </ul>
        </section>
      </div>

      <div class="toolbar">
        <input class="search" type="search" [attr.placeholder]="'marches.caution.listing.search.placeholder' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterType()" (change)="filterType.set($any($event.target).value)">
          <option value="">{{ 'marches.common.filters.allTypes' | translate }}</option>
          @for (t of typeOptions; track t) { <option [value]="t">{{ CAUTION_TYPE_KEYS[t] | translate }}</option> }
        </select>
        <span class="count">{{ 'marches.caution.listing.count' | translate:{ count: filtered().length } }}</span>
        @if (alertes() > 0) {
          <span class="alert-chip">{{ 'marches.caution.listing.alert' | translate:{ count: alertes() } }}</span>
        }
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'marches.caution.listing.columns.numero' | translate }}</th>
            <th>{{ 'marches.caution.listing.columns.marche' | translate }}</th>
            <th>{{ 'marches.caution.listing.columns.type' | translate }}</th>
            <th>{{ 'marches.caution.listing.columns.banque' | translate }}</th>
            <th class="num">{{ 'marches.caution.listing.columns.montant' | translate }}</th>
            <th>{{ 'marches.caution.listing.columns.emission' | translate }}</th>
            <th>{{ 'marches.caution.listing.columns.validite' | translate }}</th>
            <th>{{ 'marches.caution.listing.columns.levee' | translate }}</th>
            <th>{{ 'marches.caution.listing.columns.statut' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr>
                <td><strong class="code">{{ c.numero }}</strong></td>
                <td><a [routerLink]="['/marches/contrats', c.marcheId]" class="link">{{ c.marcheNumero }}</a></td>
                <td class="type-sm">{{ CAUTION_TYPE_KEYS[c.type] | translate }}</td>
                <td>{{ c.banqueEmettrice }}</td>
                <td class="num">{{ c.montant | mad }}</td>
                <td class="date">{{ c.dateEmission | date:'dd/MM/yy' }}</td>
                <td class="date" [class.expiry-warn]="isWarn(c)">{{ c.dateValiditeJusquA | date:'dd/MM/yy' }}</td>
                <td class="date">{{ c.dateLevee ? (c.dateLevee | date:'dd/MM/yy') : '—' }}</td>
                <td><span class="badge badge--{{ statusVariant(c.status) }}">{{ CAUTION_STATUS_KEYS[c.status] | translate }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">{{ 'marches.caution.listing.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 900px) { .board { grid-template-columns: 1fr; } }
    .board__col {
      background: var(--nf-color-surface);
      border: 1px solid var(--nf-color-border);
      border-radius: 10px;
      padding: 12px 14px;
      min-height: 120px;
    }
    .board__col--warn { border-color: var(--nf-color-warning-200); background: var(--nf-color-warning-50); }
    .board__col--muted { background: var(--nf-color-bg-subtle); }
    .board__title { margin: 0 0 6px; font-size: 0.72rem; font-weight: 700; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .board__count { margin: 0 0 8px; font-size: 1.35rem; font-weight: 800; color: var(--nf-color-text-primary); }
    .board__list { margin: 0; padding-left: 1rem; font-size: 12px; color: var(--nf-color-text-primary); max-height: 140px; overflow: auto; }
    .board__list li { margin-bottom: 4px; }
    .muted { color: var(--nf-color-text-muted); list-style: none; margin-left: -1rem; }
    .board__code { font-weight: 600; color: var(--nf-color-warning-700); }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .alert-chip { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); border: 1px solid var(--nf-color-warning-200); padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 300px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 9px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.date, td.type-sm { white-space: nowrap; font-size: 12px; color: var(--nf-color-text-secondary); }
    .code { color: var(--nf-color-primary-700); font-weight: 600; }
    .link { color: var(--nf-color-primary-600); text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }
    .expiry-warn { color: var(--nf-color-warning-700) !important; font-weight: 700; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class CautionListingPage implements OnInit {
  private readonly api = inject(CautionApiService);
  private readonly toast = inject(ToastService);

  readonly CAUTION_STATUS_KEYS = CAUTION_STATUS_KEYS;
  readonly CAUTION_TYPE_KEYS = CAUTION_TYPE_KEYS;

  readonly cautions = signal<CautionBancaire[]>([]);

  readonly search = signal('');
  readonly filterType = signal<CautionType | ''>('');
  readonly typeOptions = Object.keys(CAUTION_TYPE_KEYS) as CautionType[];

  ngOnInit(): void {
    void this.loadCautions();
  }

  private async loadCautions(): Promise<void> {
    try {
      const res = await this.api.getAll();
      this.cautions.set(res.items);
    } catch {
      this.cautions.set([]);
      this.toast.error('Impossible de charger les cautions bancaires.');
    }
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const t = this.filterType();
    let all = this.cautions();
    if (t) all = all.filter(c => c.type === t);
    if (!q) return all;
    return all.filter(c => c.numero.toLowerCase().includes(q) || c.marcheNumero.toLowerCase().includes(q) || c.banqueEmettrice.toLowerCase().includes(q));
  });

  readonly alertes = computed(() => this.cautions().filter(c => this.isWarn(c)).length);

  readonly actives = computed(() =>
    this.cautions().filter(
      c => (c.status === 'ACTIVE' || c.status === 'EMISE') && !this.isWarn(c),
    ),
  );

  readonly aRenouveler = computed(() =>
    this.cautions().filter(
      c => (c.status === 'ACTIVE' || c.status === 'EMISE') && this.isWarn(c),
    ),
  );

  readonly mainlevees = computed(() =>
    this.cautions().filter(c => c.status === 'LEVEE'),
  );

  isWarn(c: { dateValiditeJusquA: string; status: CautionStatus }): boolean {
    if (c.status === 'LEVEE' || c.status === 'EXPIRE') return false;
    const d = new Date(c.dateValiditeJusquA);
    const warn = new Date();
    warn.setDate(warn.getDate() + 30);
    return d < warn;
  }

  statusVariant(s: CautionStatus): string { return STATUS_VARIANT[s] ?? 'secondary'; }
}
