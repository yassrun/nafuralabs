import { CommonModule, PercentPipe } from '@angular/common';
import { Component, LOCALE_ID, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PermissionService } from '@core/security/services/permission.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as XLSX from 'xlsx';
import { firstValueFrom, map } from 'rxjs';

import { ButtonComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { EcartCellComponent } from '../components/ecart-cell/ecart-cell.component';
import { ConsommationProgressComponent } from '../components/consommation-progress/consommation-progress.component';
import { ReviserBudgetDialogComponent } from '../components/reviser-budget-dialog/reviser-budget-dialog.component';
import type { BudgetLineItemDrilldown, BudgetLigne, BudgetRevisionDraft } from '../models';
import { BudgetFacade } from '../services';
import { BudgetEvolutionChartComponent } from './components/budget-evolution-chart/budget-evolution-chart.component';
import { EngagementsListComponent } from './components/engagements-list/engagements-list.component';
import { RevisionsHistoryComponent } from './components/revisions-history/revisions-history.component';

type DetailTab = 'rubriques' | 'lots' | 'evolution' | 'engagements' | 'revisions';

@Component({
  selector: 'app-budget-chantier-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MadCurrencyPipe,
    ButtonComponent,
    PercentPipe,
    EcartCellComponent,
    ConsommationProgressComponent,
    BudgetEvolutionChartComponent,
    EngagementsListComponent,
    RevisionsHistoryComponent,
    TranslateModule,
  ],
  template: `
    @if (budget(); as chantier) {
      <section class="detail-page">
        <a class="back-link" [routerLink]="['/chantiers/budget']">{{ 'chantiers.budget.detail.backLink' | translate }}</a>
        <header class="detail-header">
          <div>
            <p class="detail-kicker">{{ 'chantiers.budget.detail.kicker' | translate }}</p>
            <h1>{{ chantier.code }} · {{ chantier.name }}</h1>
            <p>{{ chantier.client }} · Statut {{ chantier.status }}</p>
          </div>
          <div class="hero-metrics">
            <article><span>{{ 'chantiers.budget.detail.hero.initial' | translate }}</span><strong>{{ chantier.budgetInitialHt | mad }}</strong></article>
            <article><span>{{ 'chantiers.budget.detail.hero.revise' | translate }}</span><strong>{{ chantier.budgetReviseHt | mad }}</strong></article>
            <article><span>{{ 'chantiers.budget.detail.hero.engage' | translate }}</span><strong>{{ chantier.engageHt | mad }}</strong></article>
            <article><span>{{ 'chantiers.budget.detail.hero.realise' | translate }}</span><strong>{{ chantier.realiseHt | mad }}</strong></article>
          </div>
        </header>

        @if (chantier.alerte) {
          <section class="alert-banner">
            <strong>{{ 'chantiers.budget.detail.alert.title' | translate }}</strong>
            <span>{{ chantier.alertMessage }}</span>
          </section>
        }

        <section class="summary-grid">
          <article>
            <span>{{ 'chantiers.budget.detail.summary.resteEngager' | translate }}</span>
            <strong>{{ chantier.resteAEngagerHt | mad }}</strong>
          </article>
          <article>
            <span>{{ 'chantiers.budget.detail.summary.resteExecuter' | translate }}</span>
            <strong>{{ chantier.resteAExecuterHt | mad }}</strong>
          </article>
          <article>
            <span>{{ 'chantiers.budget.detail.summary.consommation' | translate }}</span>
            <app-consommation-progress [value]="chantier.consommationPercent"></app-consommation-progress>
          </article>
          <article>
            <span>{{ 'chantiers.budget.detail.summary.margeProjetee' | translate }}</span>
            <strong [class.negative]="chantier.margeProjeteePercent < 0" [class.positive]="chantier.margeProjeteePercent >= 0">{{ chantier.margeProjeteePercent | percent:'1.1-1' }}</strong>
          </article>
        </section>

        <section class="toolbar">
          <div class="tabs">
            @for (tab of tabs(); track tab.id) {
              <nf-button
                [variant]="activeTab() === tab.id ? 'primary' : 'secondary'"
                class="tab-btn"
                (clicked)="activeTab.set(tab.id)">{{ tab.label }}</nf-button>
            }
          </div>
          <div class="actions">
            @if (canRevise()) {
              <nf-button variant="secondary" (clicked)="openRevisionDialog()">{{ 'chantiers.budget.detail.actions.reviser' | translate }}</nf-button>
            }
            <nf-button variant="secondary" (clicked)="exportExcel()">{{ 'chantiers.budget.detail.actions.exportExcel' | translate }}</nf-button>
            <nf-button variant="primary" (clicked)="printPage()">{{ 'chantiers.budget.detail.actions.printSuivi' | translate }}</nf-button>
          </div>
        </section>

        @switch (activeTab()) {
          @case ('rubriques') {
            <section class="card table-card">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>{{ 'chantiers.budget.detail.columns.rubrique' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.initial' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.revise' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.engage' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.realise' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.realiseStock' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.reste' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.ecart' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of chantier.lignes; track line.rubrique) {
                    <tr [class.expandable]="line.drilldown?.length" (click)="toggleDrilldown(line)">
                      <td>
                        <div class="rubrique-cell">
                          <strong>{{ line.label }}</strong>
                          <small>{{ line.lot }}</small>
                        </div>
                      </td>
                      <td>{{ line.initialHt | mad }}</td>
                      <td>{{ line.reviseHt | mad }}</td>
                      <td>{{ line.engageHt | mad }}</td>
                      <td>{{ line.realiseHt | mad }}</td>
                      <td>{{ (line.realiseMatiereStockHt ?? 0) | mad }}</td>
                      <td>{{ line.resteHt | mad }}</td>
                      <td><app-ecart-cell [value]="line.ecartHt" [percent]="line.ecartPercent"></app-ecart-cell></td>
                    </tr>
                    @if (expandedRubrique() === line.rubrique && line.drilldown?.length) {
                      <tr class="drilldown-row">
                        <td colspan="8">
                          <div class="drilldown">
                            <header>
                              <h3>{{ 'chantiers.budget.detail.drilldown.title' | translate }}</h3>
                              <span>{{ 'chantiers.budget.detail.drilldown.subtitle' | translate }}</span>
                            </header>
                            <table>
                              <thead>
                                <tr>
                                  <th>{{ 'chantiers.budget.detail.drilldown.article' | translate }}</th>
                                  <th>{{ 'chantiers.budget.detail.drilldown.qteBudget' | translate }}</th>
                                  <th>{{ 'chantiers.budget.detail.drilldown.qteCmd' | translate }}</th>
                                  <th>{{ 'chantiers.budget.detail.drilldown.qteLivr' | translate }}</th>
                                  <th>{{ 'chantiers.budget.detail.drilldown.qteCons' | translate }}</th>
                                  <th>{{ 'chantiers.budget.detail.drilldown.realiseStock' | translate }}</th>
                                  <th>{{ 'chantiers.budget.detail.drilldown.mtRealise' | translate }}</th>
                                  <th>{{ 'chantiers.budget.detail.drilldown.sortiesStock' | translate }}</th>
                                </tr>
                              </thead>
                              <tbody>
                                @for (item of line.drilldown; track item.id) {
                                  <tr>
                                    <td>{{ item.label }}</td>
                                    <td>{{ formatQty(item.qteBudget, item.unite) }}</td>
                                    <td>{{ formatQty(item.qteCommande, item.unite) }}</td>
                                    <td>{{ formatQty(item.qteLivree, item.unite) }}</td>
                                    <td>{{ formatQty(item.qteConsommee, item.unite) }}</td>
                                    <td>{{ formatQty(item.qteRealiseeStock ?? 0, item.unite) }}</td>
                                    <td>{{ item.montantRealiseHt | mad }}</td>
                                    <td>
                                      @if (item.articleId) {
                                        <a
                                          [routerLink]="['/inventory/mouvements/sorties']"
                                          [queryParams]="{ chantierBudgetId: chantier.id, articleId: item.articleId }"
                                          (click)="$event.stopPropagation()"
                                          >{{ 'chantiers.budget.detail.drilldown.voirSorties' | translate }}</a
                                        >
                                      }
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <th>{{ 'chantiers.budget.detail.columns.total' | translate }}</th>
                    <th>{{ chantier.budgetInitialHt | mad }}</th>
                    <th>{{ chantier.budgetReviseHt | mad }}</th>
                    <th>{{ chantier.engageHt | mad }}</th>
                    <th>{{ chantier.realiseHt | mad }}</th>
                    <th>—</th>
                    <th>{{ chantier.resteAEngagerHt | mad }}</th>
                    <th><app-ecart-cell [value]="chantier.budgetReviseHt - chantier.realiseHt" [percent]="ecartTotalPercent()"></app-ecart-cell></th>
                  </tr>
                </tfoot>
              </table>
            </section>
          }
          @case ('lots') {
            <section class="card table-card">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>{{ 'chantiers.budget.detail.columns.lot' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.initial' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.revise' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.engage' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.realise' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.reste' | translate }}</th>
                    <th>{{ 'chantiers.budget.detail.columns.ecart' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of lotLines(); track line.label) {
                    <tr>
                      <td><strong>{{ line.label }}</strong></td>
                      <td>{{ line.initialHt | mad }}</td>
                      <td>{{ line.reviseHt | mad }}</td>
                      <td>{{ line.engageHt | mad }}</td>
                      <td>{{ line.realiseHt | mad }}</td>
                      <td>{{ line.resteHt | mad }}</td>
                      <td><app-ecart-cell [value]="line.ecartHt" [percent]="line.ecartPercent"></app-ecart-cell></td>
                    </tr>
                  }
                </tbody>
              </table>
            </section>
          }
          @case ('evolution') {
            <app-budget-evolution-chart [points]="chantier.evolutionMensuelle"></app-budget-evolution-chart>
          }
          @case ('engagements') {
            <app-engagements-list [engagements]="chantier.engagements"></app-engagements-list>
          }
          @case ('revisions') {
            <app-revisions-history [revisions]="chantier.revisions"></app-revisions-history>
          }
        }
      </section>
    } @else {
      <section class="detail-page"><p>{{ 'chantiers.budget.detail.empty.notFound' | translate }}</p></section>
    }
  `,
  styles: [`
    :host { display: block; }
    .detail-page { padding: 1.5rem; display: grid; gap: 1.25rem; }
    .back-link { color: var(--nf-color-primary-600); text-decoration: none; font-weight: 700; }
    .detail-header { margin-top: 1rem; padding: 1.5rem; border-radius: 1rem; background: linear-gradient(135deg, var(--nf-color-bg-muted), var(--nf-color-bg-subtle)); display: grid; gap: 1.5rem; }
    .detail-kicker { margin: 0 0 0.35rem; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.08em; color: var(--nf-color-text-secondary); }
    .detail-header h1 { margin: 0; font-size: 2rem; color: var(--nf-text-primary); }
    .detail-header p { margin: 0.4rem 0 0; color: var(--nf-color-text-secondary); }
    .hero-metrics { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .hero-metrics article { border-radius: 1rem; background: var(--nf-color-surface); padding: 1rem; border: 1px solid var(--nf-color-border); }
    .hero-metrics span { display: block; font-size: 0.75rem; color: var(--nf-color-text-secondary); }
    .hero-metrics strong { display: block; margin-top: 0.35rem; font-size: 1.1rem; }
    .alert-banner { display: flex; gap: 0.75rem; align-items: center; padding: 1rem 1.25rem; border-radius: 0.9rem; background: linear-gradient(90deg, var(--nf-color-warning-50, #fff1e3), var(--nf-color-warning-100, #ffe2d2)); border: 1px solid var(--nf-color-warning-300, #f0bc93); color: var(--nf-color-warning-700, #7d3f18); }
    .summary-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .summary-grid article { display: grid; gap: 0.5rem; padding: 1rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 1rem; }
    .summary-grid span { color: var(--nf-color-text-secondary); font-size: 0.8rem; }
    .toolbar { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .tabs, .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .tab-btn { border-radius: 999px; }
    .card { padding: 1.25rem; border-radius: 1rem; border: 1px solid var(--nf-color-border); background: var(--nf-color-surface); }
    .table-card { overflow: auto; }
    .detail-table { width: 100%; border-collapse: collapse; min-width: 58rem; }
    .detail-table th, .detail-table td { padding: 0.9rem 1rem; border-bottom: 1px solid var(--nf-color-border); text-align: left; }
    .detail-table th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--nf-color-text-secondary); background: var(--nf-color-bg-subtle); }
    .detail-table tfoot th { position: sticky; bottom: 0; background: var(--nf-color-bg-muted); z-index: 1; }
    .rubrique-cell { display: grid; gap: 0.2rem; }
    .rubrique-cell strong { color: var(--nf-text-primary); }
    .rubrique-cell small { color: var(--nf-color-text-secondary); }
    .expandable { cursor: pointer; }
    .expandable:hover { background: var(--nf-color-bg-subtle); }
    .drilldown-row td { background: var(--nf-color-bg-subtle); }
    .drilldown { display: grid; gap: 1rem; padding: 0.5rem 0; }
    .drilldown header { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
    .drilldown h3 { margin: 0; color: var(--nf-text-primary); }
    .drilldown header span { color: var(--nf-color-text-secondary); }
    .drilldown table { width: 100%; border-collapse: collapse; }
    .drilldown th, .drilldown td { padding: 0.7rem 0.8rem; border-bottom: 1px solid var(--nf-color-border); }
    .positive { color: var(--nf-color-success-700); }
    .negative { color: var(--nf-color-danger-700); }
    @media (max-width: 960px) { .hero-metrics { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 960px) { .summary-grid { grid-template-columns: 1fr 1fr; } }
  `],
})
export class BudgetChantierDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(BudgetFacade);
  private readonly dialog = inject(MatDialog);
  private readonly locale = inject(LOCALE_ID);
  private readonly permissionService = inject(PermissionService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);
  private readonly budgetId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' }
  );

  readonly activeTab = signal<DetailTab>('rubriques');
  readonly expandedRubrique = signal<string | null>('MATERIAUX');
  readonly tabs = computed<Array<{ id: DetailTab; label: string }>>(() => [
    { id: 'rubriques', label: this.translate.instant('chantiers.budget.detail.tabs.rubriques') },
    { id: 'lots', label: this.translate.instant('chantiers.budget.detail.tabs.lots') },
    { id: 'evolution', label: this.translate.instant('chantiers.budget.detail.tabs.evolution') },
    { id: 'engagements', label: this.translate.instant('chantiers.budget.detail.tabs.engagements') },
    { id: 'revisions', label: this.translate.instant('chantiers.budget.detail.tabs.revisions') },
  ]);

  readonly budget = computed(() => this.facade.getBudgetById(this.budgetId()));

  constructor() {
    effect(() => {
      const id = this.budgetId();
      if (id) {
        void this.facade.loadBudgetFromApi(id);
      }
    });
  }

  readonly lotLines = computed(() => {
    const chantier = this.budget();
    if (!chantier) return [];

    const grouped = new Map<string, BudgetLigne>();
    for (const line of chantier.lignes) {
      const current = grouped.get(line.lot);
      if (current) {
        current.initialHt += line.initialHt;
        current.reviseHt += line.reviseHt;
        current.engageHt += line.engageHt;
        current.realiseHt += line.realiseHt;
        current.resteHt += line.resteHt;
        current.ecartHt += line.ecartHt;
      } else {
        grouped.set(line.lot, { ...line, label: line.lot, drilldown: undefined });
      }
    }

    return Array.from(grouped.values()).map((line) => ({
      ...line,
      ecartPercent: line.reviseHt ? Number(((line.ecartHt / line.reviseHt) * 100).toFixed(1)) : 0,
    }));
  });

  canRevise(): boolean {
    return this.permissionService.hasPermission('chantiers.budget.reviser');
  }

  ecartTotalPercent(): number {
    const chantier = this.budget();
    if (!chantier?.budgetReviseHt) return 0;
    return Number((((chantier.budgetReviseHt - chantier.realiseHt) / chantier.budgetReviseHt) * 100).toFixed(1));
  }

  toggleDrilldown(line: BudgetLigne): void {
    if (!line.drilldown?.length) return;
    this.expandedRubrique.update((current) => current === line.rubrique ? null : line.rubrique);
  }

  formatQty(value: number, unit: string): string {
    return `${new Intl.NumberFormat(this.locale).format(value)} ${unit}`;
  }

  async openRevisionDialog(): Promise<void> {
    const chantier = this.budget();
    if (!chantier) return;

    const dialogRef = this.dialog.open(ReviserBudgetDialogComponent, {
      width: '900px',
      maxWidth: '96vw',
      data: { chantier },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.facade.saveRevision(result as BudgetRevisionDraft);
    }
  }

  exportExcel(): void {
    const chantier = this.budget();
    if (!chantier) return;

    const workbook = XLSX.utils.book_new();
    const rubriqueRows = chantier.lignes.map((line) => ({
      Rubrique: line.label,
      Lot: line.lot,
      Initial: line.initialHt,
      Revise: line.reviseHt,
      Engage: line.engageHt,
      Realise: line.realiseHt,
      Reste: line.resteHt,
      Ecart: line.ecartHt,
      'Ecart %': line.ecartPercent,
    }));
    const drilldownRows = chantier.lignes.flatMap((line) =>
      (line.drilldown ?? []).map((item: BudgetLineItemDrilldown) => ({
        Rubrique: line.label,
        Article: item.label,
        Unite: item.unite,
        'Qte budget': item.qteBudget,
        'Qte cmd': item.qteCommande,
        'Qte livree': item.qteLivree,
        'Qte cons': item.qteConsommee,
        'Montant realise': item.montantRealiseHt,
      }))
    );
    const engagementRows = chantier.engagements.map((item) => ({
      Référence: item.reference,
      Fournisseur: item.fournisseur,
      Rubrique: item.rubrique,
      Montant: item.montantHt,
      Statut: item.statut,
      Date: item.date,
    }));
    const revisionRows = chantier.revisions.map((item) => ({
      Date: item.date,
      Motif: item.motif,
      'Ancien budget': item.ancienBudgetTotal,
      'Nouveau budget': item.nouveauBudgetTotal,
      Piece: item.pieceName ?? '',
    }));

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rubriqueRows), 'Rubriques');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(drilldownRows), 'Drilldown');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(engagementRows), 'Engagements');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(revisionRows), 'Revisions');
    const filename = `${chantier.code.toLowerCase()}-budget.xlsx`;
    XLSX.writeFile(workbook, filename);
    this.audit.log(
      'EXPORT',
      'BUDGET',
      chantier.id,
      chantier.code,
      `XLSX — ${rubriqueRows.length} rubriques, ${drilldownRows.length} articles`,
    );
  }

  printPage(): void {
    const chantier = this.budget();
    if (chantier) {
      this.audit.log('PRINT', 'BUDGET', chantier.id, chantier.code, 'Impression fiche budget');
    }
    window.print();
  }
}
