import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { ExportService } from '@lib/anatomy/services/export.service';

import {
  PilotageChantierMargesService,
  type PilotageMargePivotAxis,
} from '../../pilotage/services/pilotage-chantier-marges.service';
import { PilotageAnalysesDataService } from '../services/pilotage-analyses-data.service';

@Component({
  selector: 'app-rentabilite-analyses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (data.hydrated()) {
        @let r = data.rentabilite();
        <div class="kpi-strip" data-pilotage-loaded="true">
          @if (r) {
            <a class="kpi" routerLink="/pilotage/marges-chantier" [queryParams]="{ focus: 'marge' }">
              <span>{{ 'dashboard.analyses.rentabilite.kpis.margeBrute' | translate }}</span>
              <strong [attr.data-kpi-value]="r.margeBruteYtd">{{ r.margeBruteYtd | mad }}</strong>
            </a>
            <a class="kpi" routerLink="/pilotage/marge-consolidee">
              <span>{{ 'dashboard.analyses.rentabilite.kpis.margeNette' | translate }}</span>
              <strong [attr.data-kpi-value]="r.margeNetteYtd">{{ r.margeNetteYtd | mad }}</strong>
            </a>
            <a class="kpi" routerLink="/pilotage/marges-chantier" [queryParams]="{ sort: 'margePct' }">
              <span>{{ 'dashboard.analyses.rentabilite.kpis.margeMoyenne' | translate }}</span>
              <strong [attr.data-kpi-value]="r.margeMoyennePct">{{ r.margeMoyennePct | number:'1.1-1' }}%</strong>
            </a>
          }
        </div>

        <section class="panel">
          <h2>{{ 'dashboard.analyses.rentabilite.topTitle' | translate }}</h2>
          <ul>
            @for (c of r?.top5 ?? []; track c.chantierId) {
              <li><a [routerLink]="['/chantiers', c.chantierId]">{{ c.chantierCode }}</a> — {{ c.margePct }}%</li>
            }
          </ul>
        </section>

        <section class="panel">
          <h2>{{ 'dashboard.analyses.rentabilite.flopTitle' | translate }}</h2>
          <ul>
            @for (c of r?.flop5 ?? []; track c.chantierId) {
              <li><a [routerLink]="['/chantiers', c.chantierId]">{{ c.chantierCode }}</a> — {{ c.margePct }}%</li>
            }
          </ul>
        </section>

        <section class="panel pivot">
          <div class="pivot-head">
            <h2>{{ 'dashboard.analyses.rentabilite.pivot.title' | translate }}</h2>
            <select [value]="pivotAxis()" (change)="pivotAxis.set($any($event.target).value)">
              <option value="CHANTIER">{{ 'dashboard.analyses.rentabilite.pivot.axes.chantier' | translate }}</option>
              <option value="BU">{{ 'dashboard.analyses.rentabilite.pivot.axes.bu' | translate }}</option>
              <option value="CLIENT">{{ 'dashboard.analyses.rentabilite.pivot.axes.client' | translate }}</option>
              <option value="MOA">{{ 'dashboard.analyses.rentabilite.pivot.axes.moa' | translate }}</option>
              <option value="TYPE_MARCHE">{{ 'dashboard.analyses.rentabilite.pivot.axes.typeMarche' | translate }}</option>
            </select>
            <nf-button variant="secondary" (clicked)="exportPivot()">{{ 'dashboard.analyses.rentabilite.pivot.exportCsv' | translate }}</nf-button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ 'dashboard.analyses.rentabilite.pivot.columns.axe' | translate }}</th>
                  <th class="num">{{ 'dashboard.analyses.rentabilite.pivot.columns.marcheHt' | translate }}</th>
                  <th class="num">{{ 'dashboard.analyses.rentabilite.pivot.columns.factureHt' | translate }}</th>
                  <th class="num">{{ 'dashboard.analyses.rentabilite.pivot.columns.margeHt' | translate }}</th>
                  <th class="num">{{ 'dashboard.analyses.rentabilite.pivot.columns.margePct' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (row of pivotTable(); track row.key) {
                  <tr>
                    <td>{{ row.label }}</td>
                    <td class="num">{{ row.montantMarcheHt | mad }}</td>
                    <td class="num">{{ row.cumulFactureHt | mad }}</td>
                    <td class="num">{{ row.margeProjeteeHt | mad }}</td>
                    <td class="num">{{ row.margePct | number:'1.1-1' }}%</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      } @else {
        <p class="loading">{{ 'dashboard.analyses.rentabilite.loading' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .kpi-strip { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem; }
    .kpi { padding: 0.75rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 160px; text-decoration: none; color: inherit; }
    .kpi span { display: block; font-size: 0.7rem; color: var(--nf-color-text-muted); text-transform: uppercase; margin-bottom: 0.15rem; }
    .kpi strong { font-size: 0.95rem; font-weight: 700; color: var(--nf-text-primary, var(--nf-color-text-primary)); }
    .panel { margin-bottom: 1.25rem; padding: 1rem; border: 1px solid var(--nf-color-border); border-radius: 0.75rem; background: var(--nf-color-surface); }
    .panel h2 { margin: 0 0 0.5rem; font-size: 1rem; }
    .pivot-head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); text-align: left; }
    th.num, td.num { text-align: right; }
    .loading { color: var(--nf-color-text-secondary); }
  `],
})
export class RentabiliteAnalysesPage {
  readonly data = inject(PilotageAnalysesDataService);
  private readonly margesSvc = inject(PilotageChantierMargesService);
  private readonly exportSvc = inject(ExportService);
  private readonly translate = inject(TranslateService);

  readonly pivotAxis = signal<PilotageMargePivotAxis>('CHANTIER');

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.analyses.rentabilite.title'),
    subtitle: this.translate.instant('dashboard.analyses.rentabilite.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.rentabilite.breadcrumb') },
    ],
  }));

  readonly pivotTable = computed(() => {
    this.margesSvc.rows();
    return this.margesSvc.pivotRowsFor(this.pivotAxis());
  });

  exportPivot(): void {
    const rows = this.pivotTable();
    const t = (key: string) => this.translate.instant(key);
    this.exportSvc.exportCsv(rows, {
      filename: t('dashboard.analyses.rentabilite.export.filename'),
      columns: [
        { header: t('dashboard.analyses.rentabilite.export.headers.axe'), field: 'label' },
        { header: t('dashboard.analyses.rentabilite.export.headers.marcheHt'), field: 'montantMarcheHt', type: 'currency' },
        { header: t('dashboard.analyses.rentabilite.export.headers.factureHt'), field: 'cumulFactureHt', type: 'currency' },
        { header: t('dashboard.analyses.rentabilite.export.headers.margeHt'), field: 'margeProjeteeHt', type: 'currency' },
        { header: t('dashboard.analyses.rentabilite.export.headers.margePct'), field: 'margePct', type: 'percent' },
      ],
    });
  }
}
