import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import {
  ButtonComponent,
  IconComponent,
  PageHeaderComponent,
  PageShellComponent,
} from '@lib/anatomy';

import { BudgetFacade } from '@applications/erp/pages/chantiers/budget/services';
import { ChantierApiService } from '@applications/erp/pages/chantiers/services/chantier-api.service';
import { DemandeApiService } from '@applications/erp/pages/achats/demandes/services/demande-api.service';
import { NcApiService } from '@applications/erp/pages/hse/non-conformites/services/nc-api.service';
import { CongeApiService } from '@applications/erp/pages/rh/conges/services/conge-api.service';

import {
  DashboardLayoutService,
  type DashboardPersona,
  type DashboardWidgetId,
} from './dashboard-layout.service';
import { DashboardFacade } from './services/dashboard-facade.service';
import { BirdPyramidHseComponent } from './widgets/bird-pyramid-hse.component';
import { CaCumulChartComponent } from './widgets/ca-cumul-chart.component';
import { KpiTileComponent } from './widgets/kpi-tile.component';
import { MargeSparklineComponent } from './widgets/marge-sparkline.component';
import { TopChantiersAlerteComponent } from './widgets/top-chantiers-alerte.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MadCurrencyPipe,
    MatButtonToggleModule,
    IconComponent,
    RouterModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    KpiTileComponent,
    CaCumulChartComponent,
    MargeSparklineComponent,
    TopChantiersAlerteComponent,
    BirdPyramidHseComponent,
  ],
  templateUrl: './dashboard.page.html',
  styles: [`
    .dashboard-loading {
      padding: 24px;
      color: var(--nf-color-text-muted);
    }
    .dashboard-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 16px;
      margin-bottom: 16px;
    }
    .dashboard-toolbar__hint {
      font-size: 0.8125rem;
      color: var(--nf-color-text-secondary);
      flex: 1 1 200px;
    }
    .dashboard-drop-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .dash-widget {
      border: 1px solid var(--nf-color-border);
      border-radius: 10px;
      padding: 12px 12px 16px;
      background: var(--nf-color-surface);
    }
    .dash-widget.cdk-drag-preview {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border-radius: 10px;
    }
    .dash-widget.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .dashboard-drop-list.cdk-drop-list-dragging .dash-widget:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .dashboard-section-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      cursor: grab;
      user-select: none;
    }
    .dashboard-section-title-row:active {
      cursor: grabbing;
    }
    .dashboard-section-title-row nf-icon {
      color: var(--nf-color-text-secondary);
    }
    .dashboard-section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--nf-color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .dashboard-charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .dashboard-empty-banner {
      margin-bottom: 16px;
      padding: 1rem 1.25rem;
      background: linear-gradient(90deg, var(--nf-color-primary-50), var(--nf-color-success-50));
      border: 1px solid var(--nf-color-primary-200);
      border-radius: 10px;
    }
    .dashboard-empty-banner__title {
      margin: 0 0 0.35rem;
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--nf-text-primary, var(--nf-color-text-primary));
    }
    .dashboard-empty-banner__message {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      color: var(--nf-color-text-secondary);
      line-height: 1.5;
    }
    .dashboard-empty-banner__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .dashboard-empty-banner__cta {
      display: inline-flex;
      align-items: center;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid var(--nf-color-border);
      color: var(--nf-color-primary-700);
      background: var(--nf-color-surface);
    }
    .dashboard-empty-banner__cta--primary {
      background: var(--nf-color-primary-500);
      border-color: var(--nf-color-primary-500);
      color: var(--nf-color-primary-contrast);
    }
  `],
})
export class DashboardPage implements OnInit {
  private readonly chantierApi = inject(ChantierApiService);
  private readonly dashboardFacade = inject(DashboardFacade);
  private readonly budgetFacade = inject(BudgetFacade);
  private readonly demandeApi = inject(DemandeApiService);
  private readonly congeApi = inject(CongeApiService);
  private readonly ncApi = inject(NcApiService);
  readonly layout = inject(DashboardLayoutService);

  readonly headerConfig = {
    title: 'nav.dashboard',
    breadcrumbs: [] as { label: string; route?: string }[],
  };

  readonly loaded = signal(false);
  readonly isEmptyTenant = computed(() => this.loaded() && this.chantiersEnCours() === 0);

  readonly chantiersEnCours = signal(0);
  readonly avancementMoyen = signal(0);
  readonly caFactureHt = signal(0);
  readonly facturesEnRetard = signal(0);
  readonly commandesEnCours = signal(0);
  readonly daEnAttente = signal(0);
  readonly employes = signal(0);
  readonly congesEnAttente = signal(0);
  readonly incidentsYtd = signal(0);
  readonly ncOuvertes = signal(0);
  readonly topSurconsoMatiere = signal<Array<{ code: string; name: string; ratio: number }>>([]);
  readonly lotsPeremption30j = signal(0);

  readonly surconsoSummary = computed(() =>
    this.topSurconsoMatiere()
      .map((x) => `${x.code} (${Math.round(x.ratio * 100)}%)`)
      .join(' · ') || '—',
  );

  async ngOnInit(): Promise<void> {
    const { items: chantiers } = await this.chantierApi.getAll();

    const totalBudget = chantiers.reduce((s: number, c: { budgetHt?: number }) => s + (c.budgetHt ?? 0), 0);
    const avg =
      totalBudget > 0
        ? Math.round(
            chantiers.reduce(
              (s: number, c: { avancementPercent?: number; budgetHt?: number }) =>
                s + (c.avancementPercent ?? 0) * (c.budgetHt ?? 0),
              0,
            ) / totalBudget,
          )
        : 0;
    this.avancementMoyen.set(avg);

    try {
      const kpis = await this.dashboardFacade.loadAllKpis();
      this.chantiersEnCours.set(kpis.chantiers.nbActifs);
      this.caFactureHt.set(Number(kpis.ventes.caCumule) || 0);
      this.facturesEnRetard.set(kpis.ventes.facturesEnRetard);
      this.commandesEnCours.set(kpis.achats.nbBcEnCours);
      this.employes.set(kpis.rh.effectifs);
      const bird = kpis.hse.pyramideBird;
      this.incidentsYtd.set(
        (bird?.incidents ?? 0) + (bird?.presquAccidents ?? 0) + (bird?.at ?? 0),
      );
    } catch {
      this.chantiersEnCours.set(
        chantiers.filter((c: { status?: string }) => c.status === 'EN_COURS').length,
      );
    }

    await Promise.all([
      this.loadDemandesEnAttente(),
      this.loadCongesEnAttente(),
      this.loadNcOuvertes(),
    ]);

    try {
      this.topSurconsoMatiere.set(
        this.budgetFacade.topChantiersSurconsoMatiere(3).map((x) => ({
          code: x.code,
          name: x.name,
          ratio: x.ratioStockVsRevise,
        })),
      );
    } catch {
      this.topSurconsoMatiere.set([]);
    }

    this.loaded.set(true);
  }

  private async loadDemandesEnAttente(): Promise<void> {
    try {
      const { items } = await this.demandeApi.getAll();
      this.daEnAttente.set(items.filter((d) => d.status === 'SOUMISE').length);
    } catch {
      this.daEnAttente.set(0);
    }
  }

  private async loadCongesEnAttente(): Promise<void> {
    try {
      const { items } = await this.congeApi.getAll();
      this.congesEnAttente.set(items.filter((c) => c.status === 'DEMANDE').length);
    } catch {
      this.congesEnAttente.set(0);
    }
  }

  private async loadNcOuvertes(): Promise<void> {
    try {
      const { items } = await this.ncApi.getAll();
      this.ncOuvertes.set(
        items.filter((nc) => nc.status === 'OUVERTE' || nc.status === 'EN_COURS').length,
      );
    } catch {
      this.ncOuvertes.set(0);
    }
  }

  onPersonaChange(ev: MatButtonToggleChange): void {
    const v = ev.value as DashboardPersona | undefined;
    if (v === 'dg' || v === 'conducteur' || v === 'comptable') {
      this.layout.setPersona(v);
    }
  }

  onDrop(event: CdkDragDrop<DashboardWidgetId[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.layout.reorder(event.previousIndex, event.currentIndex);
  }

  onResetLayout(): void {
    this.layout.resetToPreset();
  }
}
