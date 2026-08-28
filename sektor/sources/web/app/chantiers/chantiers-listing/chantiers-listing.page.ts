import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, DestroyRef, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { first } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterResetComponent } from '@platform/lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import { PageHeaderComponent, PageShellComponent, ButtonComponent } from '@platform/lib/anatomy';
import type { ChantierStatus } from '@app/chantiers/models';
import {
  CHANTIER_STATUS_KEYS,
  CHANTIER_TYPE_KEYS,
} from '@app/socle/shell/i18n-labels';
import {
  PortefeuilleApiService,
  type PortefeuilleRow,
} from '../services/portefeuille-api.service';
import { buildPortefeuilleQueryParams, parsePortefeuilleState, portefeuilleReturnUrl } from './portefeuille-state';
import { formatPercentDisplay } from '@app/socle/shared/utils/percent-display.util';

/**
 * Portefeuille chantier décisionnel (cockpit-chantier AC-18/AC-19) — même read model que le
 * cockpit : chaque ligne expose statut, responsable, avancement, échéance/retard, vente active,
 * budget révisé, marge projetée, alerte principale et prochaine action. Filtres et tris sont
 * serveur ; la pagination est stable et l'URL porte l'état (retour de fiche conservé).
 */
@Component({
  selector: 'app-chantiers-listing',
  standalone: true,
  imports: [CommonModule, PageShellComponent, PageHeaderComponent, FilterResetComponent, ButtonComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="toolbar">
        <input
          class="search"
          type="search"
          [placeholder]="'chantiers.chantier.list.searchPlaceholder' | translate"
          [value]="search()"
          (input)="search.set($any($event.target).value); debouncedReload()" />
        <select [value]="filters().status" (change)="setStatus($any($event.target).value)">
          <option value="">{{ 'chantiers.common.filters.allStatuses' | translate }}</option>
          @for (s of allStatuses; track s) {
            <option [value]="s">{{ statusLabel(s) }}</option>
          }
        </select>
        <select [value]="filters().alerte" (change)="setAlerte($any($event.target).value)">
          <option value="">{{ 'chantiers.cockpit.filtres.toutesAlertes' | translate }}</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="WARNING">WARNING</option>
        </select>
        <select [value]="filters().tri" (change)="setTri($any($event.target).value)">
          <option value="code">{{ 'chantiers.cockpit.filtres.triCode' | translate }}</option>
          <option value="alerte">{{ 'chantiers.cockpit.filtres.triAlerte' | translate }}</option>
          <option value="echeance">{{ 'chantiers.cockpit.filtres.triEcheance' | translate }}</option>
          <option value="marge">{{ 'chantiers.cockpit.filtres.triMarge' | translate }}</option>
          <option value="avancement">{{ 'chantiers.cockpit.filtres.triAvancement' | translate }}</option>
        </select>
        <label class="check">
          <input type="checkbox" [checked]="filters().enRetard" (change)="toggleRetard($any($event.target).checked)" />
          {{ 'chantiers.cockpit.filtres.enRetard' | translate }}
        </label>
        <label class="check">
          <input type="checkbox" [checked]="filters().margeNegative" (change)="toggleMargeNeg($any($event.target).checked)" />
          {{ 'chantiers.cockpit.filtres.margeNegative' | translate }}
        </label>
        <span class="count">{{ countLabel() }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-button variant="secondary" size="sm" (clicked)="toggleSens()">
          {{ filters().sens === 'desc' ? '↓' : '↑' }}
        </nf-button>
        <nf-button variant="primary" (clicked)="router.navigate(['/chantiers/new'])">
          {{ 'chantiers.chantier.create.cta' | translate }}
        </nf-button>
      </div>

      @if (erreur(); as msg) {
        <div class="erreur" role="alert">
          <span>{{ msg | translate }}</span>
          <nf-button variant="secondary" size="sm" (clicked)="recharger()">
            {{ 'chantiers.common.actions.retry' | translate }}
          </nf-button>
        </div>
      }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'chantiers.chantier.list.columns.code' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.name' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.client' | translate }}</th>
              <th>{{ 'chantiers.cockpit.cols.responsable' | translate }}</th>
              @if (financeAutorisee()) {
                <th class="num">{{ 'chantiers.chantier.list.columns.venteHt' | translate }}</th>
                <th class="num">{{ 'chantiers.cockpit.cols.budgetRevise' | translate }}</th>
                <th class="num">{{ 'chantiers.cockpit.cols.margeProjetee' | translate }}</th>
              }
              <th class="center">{{ 'chantiers.chantier.list.columns.avancement' | translate }}</th>
              <th>{{ 'chantiers.cockpit.cols.echeance' | translate }}</th>
              <th>{{ 'chantiers.cockpit.cols.alerte' | translate }}</th>
              <th>{{ 'chantiers.cockpit.cols.prochaineAction' | translate }}</th>
              <th>{{ 'chantiers.chantier.list.columns.status' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @if (chargement()) {
              <tr>
                <td [attr.colspan]="financeAutorisee() ? 12 : 9" class="loading">
                  {{ 'Loading' | translate }}…
                </td>
              </tr>
            } @else {
            @for (c of rows(); track c.id) {
              <tr (click)="open(c)">
                <td><strong class="code">{{ c.code }}</strong></td>
                <td class="name">{{ c.nom }}</td>
                <td>{{ c.client ?? '—' }}</td>
                <td>{{ c.responsable ?? '—' }}</td>
                @if (financeAutorisee()) {
                  <td class="num">{{ fmtMontant(c.montantVenteActifHt) }}</td>
                  <td class="num">{{ fmtMontant(c.budgetReviseHt) }}</td>
                  <td class="num">{{ fmtMarge(c.margeProjeteeHt, c.margeProjeteePct) }}</td>
                }
                <td class="center">
                  <div class="progress-wrap">
                    <div class="progress-bar">
                      <div class="progress-fill"
                        [style.width.%]="c.avancementPercent"
                        [class.progress-fill--done]="(c.avancementPercent ?? 0) >= 100">
                      </div>
                    </div>
                    <span class="pct">{{ formatPercentDisplay(c.avancementPercent) }}</span>
                  </div>
                </td>
                <td class="date">{{ fmtEcheance(c) }}</td>
                <td>
                  @if (c.alerteCode) {
                    <span class="badge badge--{{ alerteCss(c.alerteSeverite ?? 'WARNING') }}">{{ c.alerteSeverite }}</span>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
                <td>
                  @if (c.prochaineAction) {
                    <!-- P1-19 — la décision du cockpit est consommée, pas recalculée ici. -->
                    <button type="button" class="link" (click)="openAction(c, $event)">
                      {{ c.prochaineAction.libelle | translate }}
                    </button>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
                <td>
                  <span class="badge badge--{{ statusCss(c.status) }}">{{ statusLabel(c.status) }}</span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="financeAutorisee() ? 12 : 9" class="empty">
                  @if (erreur()) {
                    <span class="muted">—</span>
                  } @else if (!hasFilter()) {
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
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination stable (AC-19) -->
      @if (total() > pageSize()) {
        <div class="pager">
          <nf-button variant="secondary" size="sm" [disabled]="page() <= 0" (clicked)="goPage(page() - 1)">
            ←
          </nf-button>
          <span class="pager__info">{{ page() + 1 }} / {{ pages() }}</span>
          <nf-button variant="secondary" size="sm" [disabled]="page() >= pages() - 1" (clicked)="goPage(page() + 1)">
            →
          </nf-button>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 240px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); cursor: pointer; }
    .check { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--nf-color-text-secondary); }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }

    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 330px); }
    /* AC-21 — 390 px : scroll horizontal explicite (table non compressible), cibles ≥ 44 px. */
    @media (max-width: 480px) {
      .table-wrap { max-width: 100%; }
      table { min-width: 760px; }
      .toolbar { align-items: stretch; }
      .toolbar select, .toolbar .search, .toolbar nf-button { min-height: 44px; }
      .check { min-height: 44px; align-items: center; }
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    th.center { text-align: center; }
    td { padding: 9px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.center { text-align: center; }
    td.name { font-weight: 500; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    .code { color: var(--nf-color-primary-700); }
    .muted { color: var(--nf-color-text-muted); }
    .link { border: 0; background: transparent; color: var(--nf-color-primary-700); cursor: pointer; font-size: 12px; text-decoration: underline; padding: 0; }
    .erreur { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0.9rem; border: 1px solid var(--nf-color-danger-600); border-radius: 8px; color: var(--nf-color-danger-700); background: var(--nf-color-danger-100); margin-bottom: 12px; font-size: 13px; }
    tbody tr { cursor: pointer; transition: background 80ms; }
    tbody tr:hover { background: var(--nf-color-bg-subtle); }

    .progress-wrap { display: flex; align-items: center; gap: 6px; justify-content: center; }
    .progress-bar { width: 48px; height: 6px; background: var(--nf-color-border); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--nf-color-primary-500); border-radius: 3px; transition: width 0.3s; }
    .progress-fill--done { background: var(--nf-color-success-600); }
    .pct { font-size: 12px; color: var(--nf-color-text-secondary); min-width: 30px; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger  { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--info    { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }

    .empty { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .loading { padding: 32px; text-align: center; color: var(--nf-color-text-secondary); font-size: 13px; }
    .empty__title { margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--nf-color-text-primary); }
    .empty__hint { margin: 0 0 16px; font-size: 13px; color: var(--nf-color-text-secondary); }
    .empty__cta { margin: 0 auto; display: inline-block; }

    .pager { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 12px; }
    .pager__info { font-size: 13px; color: var(--nf-color-text-secondary); }
  `],
})
export class ChantiersListingPage {
  protected readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);
  private readonly portefeuilleApi = inject(PortefeuilleApiService);
  private readonly fmt = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });

  readonly allStatuses: ChantierStatus[] = [
    'EN_PREPARATION', 'EN_COURS', 'PROSPECT', 'SUSPENDU', 'TERMINE', 'RECEPTIONNE', 'CLOTURE', 'ANNULE',
  ];

  readonly search = signal('');
  readonly filters = signal<{ status: string; alerte: string; tri: string; sens: string; enRetard: boolean; margeNegative: boolean }>({
    status: '', alerte: '', tri: 'code', sens: 'asc', enRetard: false, margeNegative: false,
  });
  readonly page = signal(0);
  readonly pageSize = signal(20);
  readonly total = signal(0);
  readonly rows = signal<PortefeuilleRow[]>([]);
  readonly financeAutorisee = signal(false);
  /** AC-12 — chargement distinct du vide et de l'erreur. */
  readonly chargement = signal(true);
  /** P1-21 — erreur de chargement distincte d'une liste vide. */
  readonly erreur = signal<string | null>(null);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('chantiers.chantier.list.headerTitle'),
    subtitle: this.translate.instant('chantiers.chantier.list.headerSubtitle'),
    breadcrumbs: [{ label: this.translate.instant('chantiers.routes.chantiersCrumb') }],
  }));

  constructor() {
    this.restaurerEtatDepuisUrl();
    // P1-17 — le premier sync d'URL est déclenché après la fin de la navigation initiale
    // (NavigationEnd) : un `router.navigate([], {queryParams})` lancé pendant l'activation ou
    // le premier rendu est annulé par le router et l'URL retombe sur la route nue, perdant les
    // query params restaurés. Une fois le router stabilisé, l'URL porte réellement l'état.
    this.recharger({ sync: false });
    this.router.events
      .pipe(first((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncUrl());
  }

  /** AC-19/P1-17 — l'état (recherche, filtres, tri, page) survit à l'aller-retour depuis la
   * fiche : vrais query params lisibles (jamais un blob `etat=` encodé). */
  private restaurerEtatDepuisUrl(): void {
    const state = parsePortefeuilleState(new URLSearchParams(window.location.search));
    this.search.set(state.recherche);
    this.filters.set({
      status: state.status,
      alerte: state.alerte,
      tri: state.tri,
      sens: state.sens,
      enRetard: state.enRetard,
      margeNegative: state.margeNegative,
    });
    this.page.set(state.page);
  }

  private syncUrl(): void {
    // Ne sync l'URL que sur la liste elle-même : le premier NavigationEnd peut arriver alors
    // que le router pointe déjà sur une fiche (`/chantiers/:id`) ouverte depuis la liste — dans
    // ce cas, naviguer `[]` écraserait les query params de la fiche (et son `returnUrl`).
    const url = this.router.url;
    if (url !== '/chantiers' && !url.startsWith('/chantiers?')) {
      return;
    }
    const f = this.filters();
    const params = buildPortefeuilleQueryParams({
      recherche: this.search(),
      status: f.status,
      alerte: f.alerte,
      tri: f.tri,
      sens: f.sens ?? 'asc',
      enRetard: f.enRetard,
      margeNegative: f.margeNegative,
      page: this.page(),
    });
    void this.router.navigate([], { queryParams: params, replaceUrl: true });
  }

  recharger(options?: { sync?: boolean }): void {
    if (options?.sync !== false) this.syncUrl();
    const f = this.filters();
    const recherche = this.search().trim();
    this.chargement.set(true);
    this.erreur.set(null);
    this.portefeuilleApi
      .lister({
        // P1-18 — la recherche est bien envoyée au serveur (code / nom / client).
        recherche: recherche || undefined,
        status: f.status || undefined,
        severiteAlerte: f.alerte || undefined,
        tri: f.tri,
        sens: f.sens ?? 'asc',
        enRetard: f.enRetard || undefined,
        margeNegative: f.margeNegative || undefined,
        page: this.page(),
        size: this.pageSize(),
      })
      .then((p) => {
        this.rows.set(p.items);
        this.total.set(p.total);
        this.financeAutorisee.set(p.financeAutorisee);
        this.chargement.set(false);
      })
      // P1-21 — une erreur API n'est jamais confondue avec une liste vide.
      .catch(() => {
        this.erreur.set('chantiers.portefeuille.erreurChargement');
        this.chargement.set(false);
      });
  }

  private _debounce: ReturnType<typeof setTimeout> | undefined;
  debouncedReload(): void {
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = setTimeout(() => this.recharger(), 300);
  }

  setStatus(s: string): void { this.filters.update((f) => ({ ...f, status: s })); this.page.set(0); this.recharger(); }
  setAlerte(a: string): void { this.filters.update((f) => ({ ...f, alerte: a })); this.page.set(0); this.recharger(); }
  setTri(t: string): void { this.filters.update((f) => ({ ...f, tri: t })); this.recharger(); }
  toggleRetard(v: boolean): void { this.filters.update((f) => ({ ...f, enRetard: v })); this.page.set(0); this.recharger(); }
  toggleMargeNeg(v: boolean): void { this.filters.update((f) => ({ ...f, margeNegative: v })); this.page.set(0); this.recharger(); }
  goPage(p: number): void { this.page.set(p); this.recharger(); }  readonly hasFilter = computed(() =>
    !!this.search() || !!this.filters().status || !!this.filters().alerte
    || this.filters().enRetard || this.filters().margeNegative,
  );
  readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  readonly countLabel = computed(() => {
    if (this.chargement()) {
      return `${this.translate.instant('Loading')}…`;
    }
    const n = this.total();
    const key = n <= 1 ? 'chantiers.chantier.list.countOne' : 'chantiers.chantier.list.countOther';
    return this.translate.instant(key, { count: n });
  });

  open(c: PortefeuilleRow): void {
    const f = this.filters();
    const returnUrl = portefeuilleReturnUrl({
      recherche: this.search(), status: f.status, alerte: f.alerte,
      tri: f.tri, sens: f.sens ?? 'asc', enRetard: f.enRetard,
      margeNegative: f.margeNegative, page: this.page(),
    });
    void this.router.navigate(['/chantiers', c.id], { queryParams: { returnUrl } });
  }

  openAction(c: PortefeuilleRow, event: Event): void {
    event.stopPropagation();
    if (!c.prochaineAction?.route) return;
    void this.router.navigateByUrl(
      c.prochaineAction.route.replace('{id}', encodeURIComponent(c.id)),
    );
  }

  resetFilters(): void {
    this.search.set('');
    this.filters.set({ status: '', alerte: '', tri: 'code', sens: 'asc', enRetard: false, margeNegative: false });
    this.page.set(0);
    this.recharger();
  }

  toggleSens(): void {
    this.filters.update((f) => ({ ...f, sens: f.sens === 'desc' ? 'asc' : 'desc' }));
    this.recharger();
  }

  statusLabel(s: ChantierStatus | string): string {
    const key = CHANTIER_STATUS_KEYS[s as ChantierStatus];
    if (!key) return String(s);
    const resolved = this.translate.instant(key);
    return resolved === key ? String(s) : resolved;
  }
  statusCss(s: string): string {
    return ({ EN_COURS: 'success', EN_PREPARATION: 'warning', SUSPENDU: 'warning', CLOTURE: 'secondary' } as Record<string, string>)[s] ?? 'info';
  }
  alerteCss(s: string): string {
    return s === 'CRITICAL' ? 'danger' : 'warning';
  }
  typeLabel(t: string): string {
    const key = CHANTIER_TYPE_KEYS[t as keyof typeof CHANTIER_TYPE_KEYS];
    if (!key) return t;
    const resolved = this.translate.instant(key);
    return resolved === key ? t : resolved;
  }

  fmtMontant(v: number | null | undefined): string {
    if (v == null || !Number.isFinite(v)) return '—';
    if (v >= 1_000_000) return `${this.fmt.format(Math.round(v / 1_000_000))} M`;
    return `${this.fmt.format(Math.round(v / 1_000))} K`;
  }
  fmtMarge(v: number | null | undefined, pct: number | null | undefined): string {
    const base = this.fmtMontant(v);
    if (base === '—') return '—';
    return pct != null ? `${base} · ${formatPercentDisplay(pct)}` : base;
  }
  protected readonly formatPercentDisplay = formatPercentDisplay;
  fmtEcheance(c: PortefeuilleRow): string {
    // P2-23 — même convention que le cockpit : magnitude positive + `enRetard` pour la direction.
    if (c.joursRestantsOuRetard == null) return '—';
    if (c.enRetard) return `${c.joursRestantsOuRetard} j ${this.translate.instant('chantiers.cockpit.kpi.retard')}`;
    return `${c.joursRestantsOuRetard} j ${this.translate.instant('chantiers.cockpit.kpi.restants')}`;
  }
}
