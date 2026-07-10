import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ExportButtonComponent, type ExportEvent } from '@lib/anatomy/components/molecules/export-button/export-button.component';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { APTITUDE_KEYS, TYPE_VISITE_KEYS } from '@applications/erp/shell/i18n-labels';
import type { AptitudeVisite, TypeVisite, VisiteMedicale } from '../models';
import { VisiteMedicaleApiService } from './services/visite-medicale-api.service';

const TODAY = '2026-05-10';
const WARN_THRESHOLD_DAYS = 30;

const APTITUDE_CSS: Record<AptitudeVisite, string> = {
  APTE: 'tag--success',
  INAPTE: 'tag--danger',
  AVEC_RESTRICTION: 'tag--warning',
};

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - new Date(TODAY).getTime()) / 86400000);
}

@Component({
  selector: 'app-visites-medicales-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ExportButtonComponent,
    FilterResetComponent,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: ('hse.visiteMedicale.headerTitle' | translate),
        subtitle: ('hse.visiteMedicale.subtitle' | translate),
        breadcrumbs: [
          { label: ('hse.common.breadcrumb' | translate), route: '/hse/tableau-bord' },
          { label: ('hse.routes.visiteMedicale.breadcrumb' | translate) }
        ]
      }"></nf-page-header>

      <!-- Alertes -->
      @if (alertesCount() > 0 || inaptesCount() > 0) {
        <div class="alertes-bar">
          @if (inaptesCount() > 0) {
            <span class="alerte alerte--danger">⛔ {{ 'hse.visiteMedicale.alertes.inaptes' | translate: { n: inaptesCount() } }}</span>
          }
          @if (alertesCount() > 0) {
            <span class="alerte alerte--warning">⚠️ {{ 'hse.visiteMedicale.alertes.echeances' | translate: { n: alertesCount() } }}</span>
          }
        </div>
      }

      <!-- Toolbar -->
      <div class="toolbar">
        <input class="search" type="search" [placeholder]="'hse.visiteMedicale.search' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterType()" (change)="filterType.set($any($event.target).value)">
          <option value="">{{ 'hse.visiteMedicale.toolbar.tousLesTypes' | translate }}</option>
          @for (t of typeEntries(); track t[0]) { <option [value]="t[0]">{{ t[1] }}</option> }
        </select>
        <select [value]="filterAptitude()" (change)="filterAptitude.set($any($event.target).value)">
          <option value="">{{ 'hse.visiteMedicale.toolbar.toutesAptitudes' | translate }}</option>
          @for (a of aptitudeEntries(); track a[0]) { <option [value]="a[0]">{{ a[1] }}</option> }
        </select>
        <label class="alerte-toggle">
          <input type="checkbox" [checked]="filterAlerte()" (change)="filterAlerte.set($any($event.target).checked)" />
          {{ 'hse.visiteMedicale.toolbar.alerteEcheance' | translate }}
        </label>
        <span class="count">{{ 'hse.visiteMedicale.count' | translate: { n: filtered().length } }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-export-button [data]="filtered()" [columns]="exportCols()" filename="visites-medicales"
          (exported)="onExported($event)"></nf-export-button>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'hse.visiteMedicale.columns.matricule' | translate }}</th>
            <th>{{ 'hse.visiteMedicale.columns.employe' | translate }}</th>
            <th>{{ 'hse.visiteMedicale.columns.poste' | translate }}</th>
            <th>{{ 'hse.visiteMedicale.columns.typeVisite' | translate }}</th>
            <th>{{ 'hse.visiteMedicale.columns.date' | translate }}</th>
            <th>{{ 'hse.visiteMedicale.columns.aptitude' | translate }}</th>
            <th>{{ 'hse.visiteMedicale.columns.medecin' | translate }}</th>
            <th>{{ 'hse.visiteMedicale.columns.prochaineEcheance' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (v of filtered(); track v.id) {
              <tr [class.row--warn]="isProche(v)" [class.row--danger]="v.aptitude === 'INAPTE'">
                <td class="code">{{ v.employeMatricule }}</td>
                <td class="employe">{{ v.employeNom }}</td>
                <td>{{ v.posteOccupe }}</td>
                <td>{{ TYPE_VISITE_KEYS[v.type] | translate }}</td>
                <td class="date">{{ v.date | date:'dd/MM/yyyy' }}</td>
                <td>
                  <span class="tag {{ aptitudeCss(v.aptitude) }}">{{ APTITUDE_KEYS[v.aptitude] | translate }}</span>
                  @if (v.restrictions) {
                    <div class="restriction" [title]="v.restrictions">{{ v.restrictions }}</div>
                  }
                </td>
                <td>{{ v.medecinNom }}</td>
                <td class="date" [class.echeance-warn]="isProche(v)" [class.echeance-late]="isLate(v)">
                  {{ v.prochaineEcheance | date:'dd/MM/yyyy' }}
                  @if (isProche(v) || isLate(v)) {
                    <span class="badge-jours">{{ daysLabel(v) }}</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="empty">{{ 'hse.visiteMedicale.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .alertes-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .alerte { padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; }
    .alerte--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .alerte--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .alerte-toggle { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--nf-color-text-secondary); cursor: pointer; }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 360px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 9px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); vertical-align: top; }
    td.code { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-700); white-space: nowrap; }
    td.employe { font-weight: 500; white-space: nowrap; }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    .restriction { font-size: 11px; color: var(--nf-color-warning-700); margin-top: 4px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row--warn { background: var(--nf-color-warning-50); }
    .row--danger { background: var(--nf-color-danger-50); }
    .echeance-warn { color: var(--nf-color-warning-700) !important; font-weight: 700; }
    .echeance-late { color: var(--nf-color-danger-700) !important; font-weight: 700; }
    .badge-jours { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .echeance-late .badge-jours { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .tag--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .tag--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .tag--danger  { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class VisitesMedicalesListingPage {
  private readonly api = inject(VisiteMedicaleApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);

  readonly TYPE_VISITE_KEYS = TYPE_VISITE_KEYS;
  readonly APTITUDE_KEYS = APTITUDE_KEYS;

  readonly visites = signal<VisiteMedicale[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly search = signal('');
  readonly filterType = signal<TypeVisite | ''>('');
  readonly filterAptitude = signal<AptitudeVisite | ''>('');
  readonly filterAlerte = signal(false);

  readonly typeEntries = computed<[TypeVisite, string][]>(() =>
    (Object.keys(TYPE_VISITE_KEYS) as TypeVisite[]).map((s) => [s, this.translate.instant(TYPE_VISITE_KEYS[s])]),
  );
  readonly aptitudeEntries = computed<[AptitudeVisite, string][]>(() =>
    (Object.keys(APTITUDE_KEYS) as AptitudeVisite[]).map((s) => [s, this.translate.instant(APTITUDE_KEYS[s])]),
  );

  constructor() {
    void this.loadVisites();
  }

  async loadVisites(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const { items } = await this.api.getAll();
      this.visites.set(items);
    } catch {
      this.loadError.set('Impossible de charger les visites médicales.');
      this.visites.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const t = this.filterType();
    const a = this.filterAptitude();
    const onlyAlerte = this.filterAlerte();
    let list = this.visites();
    if (t) list = list.filter((v) => v.type === t);
    if (a) list = list.filter((v) => v.aptitude === a);
    if (onlyAlerte) list = list.filter((v) => this.isProche(v) || this.isLate(v));
    if (!q) return list;
    return list.filter((v) =>
      v.employeNom.toLowerCase().includes(q) ||
      v.employeMatricule.toLowerCase().includes(q) ||
      v.medecinNom.toLowerCase().includes(q) ||
      v.posteOccupe.toLowerCase().includes(q),
    );
  });

  readonly alertesCount = computed(() =>
    this.visites().filter((v) => this.isProche(v) || this.isLate(v)).length,
  );

  readonly inaptesCount = computed(() =>
    this.visites().filter((v) => v.aptitude === 'INAPTE').length,
  );

  readonly hasFilter = computed(() =>
    !!this.search() || !!this.filterType() || !!this.filterAptitude() || this.filterAlerte(),
  );

  readonly exportCols = computed(() => [
    { header: this.translate.instant('hse.visiteMedicale.columns.matricule'), field: (v: VisiteMedicale) => v.employeMatricule },
    { header: this.translate.instant('hse.visiteMedicale.columns.employe'), field: (v: VisiteMedicale) => v.employeNom },
    { header: this.translate.instant('hse.visiteMedicale.columns.poste'), field: (v: VisiteMedicale) => v.posteOccupe },
    { header: this.translate.instant('hse.visiteMedicale.columns.type'), field: (v: VisiteMedicale) => this.translate.instant(TYPE_VISITE_KEYS[v.type]) },
    { header: this.translate.instant('hse.visiteMedicale.columns.date'), field: (v: VisiteMedicale) => v.date, type: 'date' as const },
    { header: this.translate.instant('hse.visiteMedicale.columns.aptitude'), field: (v: VisiteMedicale) => this.translate.instant(APTITUDE_KEYS[v.aptitude]) },
    { header: this.translate.instant('hse.visiteMedicale.columns.medecin'), field: (v: VisiteMedicale) => v.medecinNom },
    { header: this.translate.instant('hse.visiteMedicale.columns.restrictions'), field: (v: VisiteMedicale) => v.restrictions ?? '' },
    { header: this.translate.instant('hse.visiteMedicale.columns.prochaineEcheance'), field: (v: VisiteMedicale) => v.prochaineEcheance, type: 'date' as const },
  ]);

  resetFilters(): void {
    this.search.set('');
    this.filterType.set('');
    this.filterAptitude.set('');
    this.filterAlerte.set(false);
  }

  aptitudeCss(a: AptitudeVisite): string { return APTITUDE_CSS[a] ?? 'tag--neutral'; }

  isProche(v: VisiteMedicale): boolean {
    const d = daysUntil(v.prochaineEcheance);
    return d >= 0 && d <= WARN_THRESHOLD_DAYS;
  }

  isLate(v: VisiteMedicale): boolean {
    return daysUntil(v.prochaineEcheance) < 0;
  }

  daysLabel(v: VisiteMedicale): string {
    const d = daysUntil(v.prochaineEcheance);
    if (d < 0) return this.translate.instant('hse.visiteMedicale.echeance.retardLabel', { n: Math.abs(d) });
    if (d === 0) return this.translate.instant('hse.visiteMedicale.echeance.todayLabel');
    return this.translate.instant('hse.visiteMedicale.echeance.jMoinsLabel', { n: d });
  }

  onExported(ev: ExportEvent): void {
    this.audit.log(
      ev.format === 'print' ? 'PRINT' : 'EXPORT',
      'VISITE_MEDICALE',
      ev.filename,
      this.translate.instant('hse.visiteMedicale.audit.labelListing'),
      this.translate.instant('hse.visiteMedicale.audit.exportNote', { format: ev.format.toUpperCase(), rowCount: ev.rowCount }),
    );
  }
}
