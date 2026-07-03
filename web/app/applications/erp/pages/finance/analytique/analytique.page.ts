import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy/components';
import { AnalyticsApiService, type AnalyticsBucketResponse } from '@applications/erp/pages/analytics/services/analytics-api.service';
import type {
  AnalytiquePivot,
  AxeAnalytiqueType,
  CompteClasse,
} from '@applications/erp/finance/models';

@Component({
  selector: 'app-analytique',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig">
      </nf-page-header>

      <section class="filters">
        <label>
          <span>{{ 'finance.analytique.fields.axe' | translate }}</span>
          <select [ngModel]="axeType()" (ngModelChange)="axeType.set($event); refresh()">
            <option value="CHANTIER">{{ 'finance.analytique.axeTypes.CHANTIER' | translate }}</option>
            <option value="DEPARTEMENT">{{ 'finance.analytique.axeTypes.DEPARTEMENT' | translate }}</option>
            <option value="ACTIVITE">{{ 'finance.analytique.axeTypes.ACTIVITE' | translate }}</option>
          </select>
        </label>
        <label>
          <span>{{ 'finance.common.filters.from' | translate }}</span>
          <input type="date" [ngModel]="dateDebut()" (ngModelChange)="dateDebut.set($event); refresh()" />
        </label>
        <label>
          <span>{{ 'finance.common.filters.to' | translate }}</span>
          <input type="date" [ngModel]="dateFin()" (ngModelChange)="dateFin.set($event); refresh()" />
        </label>
        <label>
          <span>{{ 'finance.analytique.fields.comptes' | translate }}</span>
          <select [ngModel]="classes()" (ngModelChange)="onClasses($event)">
            <option value="6,7">{{ 'finance.analytique.compteSets.both' | translate }}</option>
            <option value="6">{{ 'finance.analytique.compteSets.charges' | translate }}</option>
            <option value="7">{{ 'finance.analytique.compteSets.produits' | translate }}</option>
          </select>
        </label>
        <label>
          <span>{{ 'finance.common.actions.search' | translate }}</span>
          <input type="search" [ngModel]="search()" (ngModelChange)="search.set($event); refresh()"
            [attr.placeholder]="'finance.analytique.searchPlaceholder' | translate" />
        </label>
        <nf-button variant="primary" class="btn-primary" (clicked)="onExport()">{{ 'finance.analytique.actions.exportExcel' | translate }}</nf-button>
      </section>

      @if (loading()) {
        <div class="loading">{{ 'finance.common.toasts.loading' | translate }}</div>
      } @else {
      @if (pivot(); as p) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'finance.common.filters.compte' | translate }}</th>
                <th>{{ 'finance.ecriture.form.fields.libelle' | translate }}</th>
                @for (a of p.axes; track a.id) {
                  <th class="num">{{ a.libelle }}</th>
                }
                <th class="num total">{{ 'finance.common.labels.total' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (c of p.comptes; track c.code) {
                <tr [class.classe-7]="c.classe === 7">
                  <td><strong>{{ c.code }}</strong></td>
                  <td>{{ c.libelle }}</td>
                  @for (a of p.axes; track a.id) {
                    <td class="num">
                      @if (c.parAxe[a.id]) {
                        <nf-button variant="primary" class="cell-link" (clicked)="onDrill(c.code, a.id)">
                          {{ fmt(c.parAxe[a.id]) }}
                        </nf-button>
                      } @else {
                        <span class="zero">{{ 'finance.common.dash' | translate }}</span>
                      }
                    </td>
                  }
                  <td class="num total">{{ fmt(c.total) }}</td>
                </tr>
              } @empty {
                <tr><td [attr.colspan]="2 + p.axes.length + 1" class="empty">{{ 'finance.analytique.emptyState' | translate }}</td></tr>
              }
            </tbody>
            @if (p.comptes.length > 0) {
              <tfoot>
                <tr>
                  <td colspan="2"><strong>{{ 'finance.analytique.margeLabel' | translate }}</strong></td>
                  @for (a of p.axes; track a.id) {
                    <td class="num"
                      [class.positive]="p.margeParAxe[a.id] > 0"
                      [class.negative]="p.margeParAxe[a.id] < 0">
                      <strong>{{ fmt(p.margeParAxe[a.id]) }}</strong>
                    </td>
                  }
                  <td class="num total"><strong>{{ fmt(margeTotale()) }}</strong></td>
                </tr>
              </tfoot>
            }
          </table>
        </div>
      }
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .filters { display: flex; gap: 14px; align-items: end; margin-bottom: 16px; flex-wrap: wrap; }
    .filters label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--nf-color-text-secondary); }
    .filters input, .filters select { padding: 6px 10px; border: 1px solid var(--nf-color-primary-200); border-radius: 6px; font-size: 13px; background: white; }
    .btn-primary { padding: 8px 14px; background: var(--nf-color-success-600); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-left: auto; }
    .table-wrap { background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 320px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-primary-200); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    tbody tr:hover { background: var(--nf-color-bg-subtle); }
    tr.classe-7 { background: var(--nf-color-success-50); }
    tr.classe-7:hover { background: var(--nf-color-success-100); }
    .total { background: var(--nf-color-bg-subtle); }
    .cell-link {
      background: transparent; border: none; color: var(--nf-color-primary-700); font-weight: 500;
      font-size: 13px; cursor: pointer; padding: 2px 0; font-variant-numeric: tabular-nums;
    }
    .cell-link:hover { text-decoration: underline; }
    .zero { color: var(--nf-color-primary-200); }
    tfoot td { background: var(--nf-color-bg-muted); padding: 10px 12px; border-top: 2px solid var(--nf-color-primary-200); }
    .positive { color: var(--nf-color-success-600); }
    .negative { color: var(--nf-color-danger-600); }
    .empty { padding: 24px; text-align: center; color: var(--nf-color-text-muted); }
    .loading { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
  `],
})
export class AnalytiquePage {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = {
    title: this.translate.instant('finance.analytique.title'),
    subtitle: this.translate.instant('finance.analytique.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('finance.module.shortTitle'), route: '/finance/journaux' },
      { label: this.translate.instant('finance.analytique.title') },
    ],
  };

  readonly axeType = signal<AxeAnalytiqueType>('CHANTIER');
  readonly dateDebut = signal<string>('2026-01-01');
  readonly dateFin = signal<string>('2026-04-30');
  readonly classes = signal<string>('6,7');
  readonly search = signal<string>('');

  readonly pivot = signal<AnalytiquePivot | null>(null);
  readonly loading = signal(true);

  readonly margeTotale = computed(() => {
    const p = this.pivot();
    if (!p) return 0;
    return Object.values(p.margeParAxe).reduce((s, v) => s + v, 0);
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    const classes = this.classes()
      .split(',')
      .map((s) => +s as CompteClasse);
    const dimension = this.axeType() === 'CHANTIER' ? 'axe' : 'bu';
    void this.analyticsApi
      .getBuckets('finance', {
        dimensions: dimension,
        from: this.dateDebut(),
        to: this.dateFin(),
        metrics: 'opexMouv,caFactureHt',
      })
      .then((res) => {
        this.pivot.set(buildPivotFromFinanceAnalytics(res, classes, this.search()));
        this.loading.set(false);
      })
      .catch(() => {
        this.pivot.set({ axes: [], comptes: [], margeParAxe: {} });
        this.loading.set(false);
      });
  }

  onClasses(v: string): void {
    this.classes.set(v);
    this.refresh();
  }

  onDrill(compteCode: string, axeId: string): void {
    this.router.navigate(['/finance/journaux/ecritures'], {
      queryParams: {
        compteCode,
        axeAnalytique: axeId === 'NON_AFFECTE' ? '' : axeId,
        dateDebut: this.dateDebut(),
        dateFin: this.dateFin(),
      },
    });
  }

  onExport(): void {
    const p = this.pivot();
    if (!p) return;
    const headers = [
      this.translate.instant('finance.common.filters.compte'),
      this.translate.instant('finance.ecriture.form.fields.libelle'),
      ...p.axes.map((a) => a.libelle),
      this.translate.instant('finance.common.labels.total'),
    ];
    const margeLabel = this.translate.instant('finance.analytique.margeShort');
    const rows = [
      headers,
      ...p.comptes.map((c) => [
        c.code,
        c.libelle,
        ...p.axes.map((a) => c.parAxe[a.id] ?? 0),
        c.total,
      ]),
      [margeLabel, '', ...p.axes.map((a) => p.margeParAxe[a.id] ?? 0), this.margeTotale()],
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytique-${this.axeType()}-${this.dateDebut()}_${this.dateFin()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success(this.translate.instant('finance.analytique.toasts.exported'));
  }

  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });

  fmt(n?: number): string {
    if (!n) return '';
    if (Math.abs(n) > 1_000_000) {
      return `${(n / 1_000_000).toFixed(2)} M`;
    }
    if (Math.abs(n) > 1_000) {
      return `${Math.round(n / 1_000)} K`;
    }
    return this.formatter.format(Math.round(n));
  }
}

function buildPivotFromFinanceAnalytics(
  res: AnalyticsBucketResponse,
  classes: CompteClasse[],
  search: string,
): AnalytiquePivot {
  const includeCharges = classes.includes(6);
  const includeProduits = classes.includes(7);
  const term = search.trim().toLowerCase();
  const axes = (res.rows ?? []).map((r, i) => ({
    id: r.keys.join('|') || `axe-${i}`,
    libelle: r.keys.filter(Boolean).join(' · ') || '—',
  }));
  const margeParAxe: Record<string, number> = {};
  for (const axe of axes) {
    margeParAxe[axe.id] = 0;
  }
  const comptes: AnalytiquePivot['comptes'] = [];

  if (includeCharges) {
    const parAxe: Record<string, number> = {};
    (res.rows ?? []).forEach((r, i) => {
      const id = axes[i]?.id ?? `axe-${i}`;
      const amount = Number(r.metrics?.['opexMouv']) || 0;
      parAxe[id] = amount;
      margeParAxe[id] = (margeParAxe[id] ?? 0) - amount;
    });
    comptes.push({
      code: '6',
      libelle: 'Charges d\'exploitation',
      classe: 6,
      parAxe,
      total: Object.values(parAxe).reduce((s, v) => s + v, 0),
    });
  }

  if (includeProduits) {
    const parAxe: Record<string, number> = {};
    (res.rows ?? []).forEach((r, i) => {
      const id = axes[i]?.id ?? `axe-${i}`;
      const amount = Number(r.metrics?.['caFactureHt']) || 0;
      parAxe[id] = amount;
      margeParAxe[id] = (margeParAxe[id] ?? 0) + amount;
    });
    comptes.push({
      code: '7',
      libelle: 'Produits d\'exploitation',
      classe: 7,
      parAxe,
      total: Object.values(parAxe).reduce((s, v) => s + v, 0),
    });
  }

  const filtered = term
    ? comptes.filter(
        (c) => c.code.toLowerCase().includes(term) || c.libelle.toLowerCase().includes(term),
      )
    : comptes;

  return { axes, comptes: filtered, margeParAxe };
}
