import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { EPI_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

import { EpiApiService } from './services/epi-api.service';
import {
  CAT_ICON,
  STATUS_CSS,
  type EpiRecord,
  type EpiStatus,
  type EpiVolet,
  daysUntilExpiry,
  filterByVolet,
} from './epi.models';

@Component({
  selector: 'app-epi-volet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, MadCurrencyPipe, FilterResetComponent],
  template: `
      @if (aRenouveler() > 0 || expires() > 0) {
        <div class="alertes-bar">
          @if (expires() > 0) {
            <span class="alerte alerte--danger">🔴 {{ 'hse.epi.alertes.expires' | translate: { n: expires() } }}</span>
          }
          @if (aRenouveler() > 0) {
            <span class="alerte alerte--warning">🟡 {{ 'hse.epi.alertes.aRenouveler' | translate: { n: aRenouveler() } }}</span>
          }
        </div>
      }

      <div class="toolbar">
        <input class="search" type="search" [placeholder]="'hse.epi.search' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'hse.common.messages.tousLesStatuts' | translate }}</option>
          @for (s of statusEntries(); track s[0]) { <option [value]="s[0]">{{ s[1] }}</option> }
        </select>
        <span class="count">{{ 'hse.epi.count' | translate: { n: filtered().length } }}</span>
        @if (volet() !== 'reference') {
          <span class="cout">{{ 'hse.epi.coutFiltre' | translate: { amount: (totalCout() | mad) } }}</span>
        }
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
      </div>

      <p class="volet-hint">{{ voletHintKey() | translate }}</p>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'hse.epi.columns.categorie' | translate }}</th>
            <th>{{ 'hse.epi.columns.reference' | translate }}</th>
            <th>{{ 'hse.epi.columns.designation' | translate }}</th>
            <th>{{ 'hse.epi.columns.normeCE' | translate }}</th>
            @if (volet() !== 'reference') {
              <th>{{ 'hse.epi.columns.employe' | translate }}</th>
              <th>{{ 'hse.epi.columns.chantier' | translate }}</th>
              <th>{{ 'hse.epi.columns.attribution' | translate }}</th>
              <th>{{ 'hse.epi.columns.expiration' | translate }}</th>
            }
            @if (volet() === 'verification') {
              <th>{{ 'hse.epi.columns.derniereVerif' | translate }}</th>
              <th>{{ 'hse.epi.columns.prochaineVerif' | translate }}</th>
            }
            @if (volet() !== 'reference') {
              <th class="num">{{ 'hse.epi.columns.prixUnit' | translate }}</th>
              <th>{{ 'hse.epi.columns.statut' | translate }}</th>
            }
            @if (volet() === 'reference') {
              <th class="num">{{ 'hse.epi.columns.prixIndicatif' | translate }}</th>
            }
          </tr></thead>
          <tbody>
            @for (e of filtered(); track e.id) {
              <tr [class.row--warn]="e.status === 'A_RENOUVELER'" [class.row--danger]="e.status === 'EXPIRE' || e.status === 'PERDU'">
                <td class="cat">{{ catIcon(e.categorie) }}</td>
                <td class="code">{{ e.reference }}</td>
                <td>{{ e.designation }}</td>
                <td class="norme">{{ e.normeCE ?? '—' }}</td>
                @if (volet() !== 'reference') {
                  <td>{{ e.employeNom }}</td>
                  <td>{{ e.chantierCode ?? '—' }}</td>
                  <td class="date">{{ e.dateAttribution | date:'dd/MM/yy' }}</td>
                  <td class="date" [class.expiry-warn]="isExpiring(e)">
                    {{ e.dateExpiration ? (e.dateExpiration | date:'dd/MM/yy') : '—' }}
                    @if (e.dateExpiration && daysUntilExpiryDays(e.dateExpiration) <= 30 && daysUntilExpiryDays(e.dateExpiration) > 0) {
                      <span class="days-left">{{ 'hse.epi.expirationDays' | translate: { n: daysUntilExpiryDays(e.dateExpiration) } }}</span>
                    }
                  </td>
                }
                @if (volet() === 'verification') {
                  <td class="date">{{ e.dateDerniereVerification ? (e.dateDerniereVerification | date:'dd/MM/yy') : '—' }}</td>
                  <td class="date">{{ e.prochaineVerification ? (e.prochaineVerification | date:'dd/MM/yy') : '—' }}</td>
                }
                @if (volet() !== 'reference') {
                  <td class="num">{{ e.prixUnitaire | mad }}</td>
                  <td><span class="badge {{ statusCss(e.status) }}">{{ EPI_STATUS_KEYS[e.status] | translate }}</span></td>
                }
                @if (volet() === 'reference') {
                  <td class="num">{{ e.prixUnitaire | mad }}</td>
                }
              </tr>
            } @empty {
              <tr><td [attr.colspan]="volet() === 'reference' ? 5 : volet() === 'verification' ? 12 : 10" class="empty">{{ 'hse.epi.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
  `,
  styles: [`
    :host { display: block; }
    .volet-hint { font-size: 12.5px; color: var(--nf-color-text-secondary); margin: 0 0 0.75rem; }
    .alertes-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .alerte { padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; }
    .alerte--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .alerte--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .count, .cout { font-size: 13px; color: var(--nf-color-text-secondary); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 420px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 9px 10px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.date { white-space: nowrap; font-size: 12px; color: var(--nf-color-text-secondary); }
    td.code { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-700); }
    td.cat { text-align: center; font-size: 1.25rem; }
    td.norme { font-size: 11px; color: var(--nf-color-text-muted); white-space: nowrap; }
    .row--warn { background: var(--nf-color-warning-50); }
    .row--danger { background: var(--nf-color-danger-50); }
    .expiry-warn { color: var(--nf-color-danger-600) !important; font-weight: 700; }
    .days-left { font-size: 10px; color: var(--nf-color-danger-600); font-weight: 700; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class EpiVoletPage {
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly api = inject(EpiApiService);

  readonly EPI_STATUS_KEYS = EPI_STATUS_KEYS;

  readonly volet = toSignal(
    this.route.data.pipe(map((d) => (d['epiVolet'] ?? 'reference') as EpiVolet)),
    { initialValue: 'reference' },
  );

  readonly search = signal('');
  readonly filterStatus = signal<EpiStatus | ''>('');
  private readonly all = signal<EpiRecord[]>([]);

  constructor() {
    void this.loadFromApi();
  }

  private async loadFromApi(): Promise<void> {
    try {
      const { items } = await this.api.getAll({ page: 0, pageSize: 500 });
      this.all.set(items);
    } catch {
      this.all.set([]);
    }
  }

  readonly statusEntries = computed<[EpiStatus, string][]>(() =>
    (Object.keys(EPI_STATUS_KEYS) as EpiStatus[]).map((s) => [s, this.translate.instant(EPI_STATUS_KEYS[s])]),
  );

  readonly voletHintKey = computed(() => {
    switch (this.volet()) {
      case 'reference':
        return 'hse.epi.hints.reference';
      case 'attribution':
        return 'hse.epi.hints.attribution';
      default:
        return 'hse.epi.hints.verification';
    }
  });

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const st = this.filterStatus();
    let list = [...this.all()];
    if (st) list = list.filter((e) => e.status === st);
    if (q) {
      list = list.filter((e) =>
        e.employeNom.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q) ||
        (e.chantierCode ?? '').toLowerCase().includes(q) ||
        e.reference.toLowerCase().includes(q),
      );
    }
    return filterByVolet(list, this.volet());
  });

  readonly aRenouveler = computed(() =>
    this.all().filter((e) => e.status === 'A_RENOUVELER').length,
  );
  readonly expires = computed(() =>
    this.all().filter((e) => e.status === 'EXPIRE' || e.status === 'PERDU').length,
  );
  readonly totalCout = computed(() => this.filtered().reduce((s, e) => s + e.prixUnitaire, 0));

  readonly hasFilter = computed(() => !!this.search() || !!this.filterStatus());

  resetFilters(): void {
    this.search.set('');
    this.filterStatus.set('');
  }

  isExpiring(e: EpiRecord): boolean {
    return e.status === 'EXPIRE' || e.status === 'A_RENOUVELER';
  }

  catIcon = (c: EpiRecord['categorie']) => CAT_ICON[c] ?? '🛡';
  statusCss = (s: EpiStatus) => STATUS_CSS[s] ?? 'badge--secondary';
  daysUntilExpiryDays(d: string): number {
    return daysUntilExpiry(d);
  }
}
