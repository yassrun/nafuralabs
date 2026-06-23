import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { BirdPyramidHseComponent } from '@applications/erp/pages/dashboard/widgets/bird-pyramid-hse.component';
import { IncidentApiService } from '../incidents/services/incident-api.service';
import { NcApiService } from '../non-conformites/services/nc-api.service';
import { InspectionApiService } from '../inspections/services/inspection-api.service';
import { FormationApiService } from '../formations/services/formation-api.service';
import { HseKpiApiService } from './services/hse-kpi-api.service';
import {
  buildHseDashboardKpis,
  emptyHseDashboardKpis,
  type HseDashboardKpis,
} from './tableau-bord-hse-kpis.util';

@Component({
  selector: 'app-tableau-bord-hse',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, BirdPyramidHseComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: ('hse.dashboard.headerTitle' | translate),
        subtitle: ('hse.dashboard.headerSubtitle' | translate),
        breadcrumbs: [
          { label: ('hse.common.breadcrumb' | translate) },
          { label: ('hse.routes.tableauBord.breadcrumb' | translate) }
        ]
      }"></nf-page-header>

      <!-- KPIs -->
      <div class="kpi-grid">
        <article class="kpi-card kpi-card--danger">
          <div class="kpi-icon">⚠️</div>
          <div>
            <span class="kpi-label">{{ 'hse.dashboard.kpi.atYtd.label' | translate }}</span>
            <strong class="kpi-val">{{ kpis().at }}</strong>
            <span class="kpi-sub">{{ 'hse.dashboard.kpi.atYtd.sub' | translate: { mortels: 0, avecArret: kpis().at } }}</span>
          </div>
        </article>
        <article class="kpi-card">
          <div class="kpi-icon">📊</div>
          <div>
            <span class="kpi-label">{{ 'hse.dashboard.kpi.tf.label' | translate }}</span>
            <strong class="kpi-val">{{ kpis().tf }}</strong>
            <span class="kpi-sub">{{ 'hse.dashboard.kpi.tf.sub' | translate }}</span>
          </div>
        </article>
        <article class="kpi-card">
          <div class="kpi-icon">📈</div>
          <div>
            <span class="kpi-label">{{ 'hse.dashboard.kpi.tg.label' | translate }}</span>
            <strong class="kpi-val">{{ kpis().tg }}</strong>
            <span class="kpi-sub">{{ 'hse.dashboard.kpi.tg.sub' | translate }}</span>
          </div>
        </article>
        <article class="kpi-card kpi-card--warning">
          <div class="kpi-icon">🔴</div>
          <div>
            <span class="kpi-label">{{ 'hse.dashboard.kpi.ncOuvertes.label' | translate }}</span>
            <strong class="kpi-val">{{ kpis().ncOuvertes }}</strong>
            <span class="kpi-sub">{{ 'hse.dashboard.kpi.ncOuvertes.sub' | translate: { critiques: kpis().ncCritiques } }}</span>
          </div>
        </article>
        <article class="kpi-card">
          <div class="kpi-icon">🔍</div>
          <div>
            <span class="kpi-label">{{ 'hse.dashboard.kpi.inspectionsMois.label' | translate }}</span>
            <strong class="kpi-val">{{ kpis().inspectionsMois }}</strong>
            <span class="kpi-sub">{{ 'hse.dashboard.kpi.inspectionsMois.sub' | translate: { reste: kpis().inspectionsPlannifieReste } }}</span>
          </div>
        </article>
        <article class="kpi-card kpi-card--success">
          <div class="kpi-icon">✅</div>
          <div>
            <span class="kpi-label">{{ 'hse.dashboard.kpi.joursSansAT.label' | translate }}</span>
            <strong class="kpi-val">{{ kpis().joursSansAT }}</strong>
            <span class="kpi-sub">{{ 'hse.dashboard.kpi.joursSansAT.sub' | translate: { record: 180 } }}</span>
          </div>
        </article>
      </div>

      <section class="bird-section">
        <h3>{{ 'hse.dashboard.birdTitle' | translate }}</h3>
        <app-dashboard-bird-pyramid-hse />
      </section>

      <!-- Liens rapides -->
      <div class="quick-links">
        <h3>{{ 'hse.dashboard.quickLinks.title' | translate }}</h3>
        <div class="links-grid">
          <a routerLink="/hse/incidents" class="ql-card">
            <span class="ql-icon">🚨</span>
            <span>{{ 'hse.dashboard.quickLinks.incidents.label' | translate }}</span>
            <span class="ql-count">{{ 'hse.dashboard.quickLinks.incidents.count' | translate: { n: kpis().at } }}</span>
          </a>
          <a routerLink="/hse/non-conformites" class="ql-card ql-card--warn">
            <span class="ql-icon">❌</span>
            <span>{{ 'hse.dashboard.quickLinks.nc.label' | translate }}</span>
            <span class="ql-count">{{ 'hse.dashboard.quickLinks.nc.count' | translate: { n: kpis().ncOuvertes } }}</span>
          </a>
          <a routerLink="/hse/inspections" class="ql-card">
            <span class="ql-icon">📋</span>
            <span>{{ 'hse.dashboard.quickLinks.inspections.label' | translate }}</span>
            <span class="ql-count">{{ 'hse.dashboard.quickLinks.inspections.count' | translate: { n: kpis().inspectionsMois } }}</span>
          </a>
          <a routerLink="/hse/formations" class="ql-card">
            <span class="ql-icon">🎓</span>
            <span>{{ 'hse.dashboard.quickLinks.formations.label' | translate }}</span>
            <span class="ql-count">{{ 'hse.dashboard.quickLinks.formations.count' | translate: { n: kpis().formationsEnCours } }}</span>
          </a>
          <a routerLink="/hse/epi/reference" class="ql-card">
            <span class="ql-icon">🦺</span>
            <span>{{ 'hse.dashboard.quickLinks.epi.label' | translate }}</span>
            <span class="ql-count">{{ 'hse.dashboard.quickLinks.epi.count' | translate: { n: kpis().epiExpires } }}</span>
          </a>
          <a routerLink="/hse/phs" class="ql-card">
            <span class="ql-icon">📄</span>
            <span>{{ 'hse.dashboard.quickLinks.phs.label' | translate }}</span>
            <span class="ql-count">{{ 'hse.dashboard.quickLinks.phs.count' | translate }}</span>
          </a>
          <a routerLink="/hse/ppsps" class="ql-card">
            <span class="ql-icon">🏗️</span>
            <span>{{ 'hse.dashboard.quickLinks.ppsps.label' | translate }}</span>
            <span class="ql-count">{{ 'hse.dashboard.quickLinks.ppsps.count' | translate }}</span>
          </a>
        </div>
      </div>

      <!-- Légal MA -->
      <div class="legal-box">
        <h3>{{ 'hse.dashboard.legal.title' | translate }}</h3>
        <div class="legal-items">
          <div class="legal-item legal-item--ok"><span>✓</span> {{ 'hse.dashboard.legal.duer' | translate }}</div>
          <div class="legal-item legal-item--ok"><span>✓</span> {{ 'hse.dashboard.legal.ppsps' | translate }}</div>
          <div class="legal-item legal-item--warn"><span>⚠</span> {{ 'hse.dashboard.legal.chs' | translate }}</div>
          <div class="legal-item legal-item--ok"><span>✓</span> {{ 'hse.dashboard.legal.registreAt' | translate }}</div>
          <div class="legal-item legal-item--warn"><span>⚠</span> {{ 'hse.dashboard.legal.visites' | translate }}</div>
        </div>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.875rem; margin-bottom: 1.5rem; }
    .kpi-card { display: flex; gap: 0.75rem; align-items: flex-start; padding: 1rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; }
    .kpi-card--danger { border-color: var(--nf-color-danger-300); background: var(--nf-color-danger-50); }
    .kpi-card--warning { border-color: var(--nf-color-warning-200); background: var(--nf-color-warning-50); }
    .kpi-card--success { border-color: var(--nf-color-success-200); background: var(--nf-color-success-50); }
    .kpi-icon { font-size: 1.75rem; flex-shrink: 0; }
    .kpi-label { display: block; font-size: 0.72rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
    .kpi-val { display: block; font-size: 1.75rem; font-weight: 800; color: var(--nf-color-text-primary); line-height: 1; }
    .kpi-sub { display: block; font-size: 0.75rem; color: var(--nf-color-text-secondary); margin-top: 0.2rem; }

    .bird-section { margin-bottom: 1.5rem; }
    .bird-section h3 {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--nf-color-text-primary);
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .quick-links { margin-bottom: 1.5rem; }
    .quick-links h3 { font-size: 0.88rem; font-weight: 700; color: var(--nf-color-text-primary); margin: 0 0 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .links-grid { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .ql-card { display: flex; flex-direction: column; gap: 4px; padding: 0.875rem 1.1rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; text-decoration: none; color: var(--nf-color-text-primary); min-width: 130px; transition: box-shadow 120ms; }
    .ql-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .ql-card--warn { border-color: var(--nf-color-warning-200); }
    .ql-icon { font-size: 1.5rem; }
    .ql-card span:nth-child(2) { font-size: 0.87rem; font-weight: 600; color: var(--nf-color-text-primary); }
    .ql-count { font-size: 0.78rem; color: var(--nf-color-text-secondary); }

    .legal-box { background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1.1rem 1.25rem; }
    .legal-box h3 { margin: 0 0 0.75rem; font-size: 0.88rem; font-weight: 700; color: var(--nf-color-text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
    .legal-items { display: flex; flex-direction: column; gap: 0.4rem; }
    .legal-item { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; padding: 6px 0; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .legal-item:last-child { border-bottom: none; }
    .legal-item--ok  span:first-child { color: var(--nf-color-success-600); font-weight: 700; }
    .legal-item--warn span:first-child { color: var(--nf-color-warning-600); font-weight: 700; }
    .legal-item--ok  { color: var(--nf-color-text-primary); }
    .legal-item--warn { color: var(--nf-color-warning-700); }
  `],
})
export class TableauBordHsePage implements OnInit {
  private readonly kpiApi = inject(HseKpiApiService);
  private readonly incidentApi = inject(IncidentApiService);
  private readonly ncApi = inject(NcApiService);
  private readonly inspectionApi = inject(InspectionApiService);
  private readonly formationApi = inject(FormationApiService);

  readonly kpis = signal<HseDashboardKpis>(emptyHseDashboardKpis());

  ngOnInit(): void {
    void this.loadKpis();
  }

  private async loadKpis(): Promise<void> {
    try {
      const [api, incidentsRes, ncsRes, inspectionsRes, formationsRes] = await Promise.all([
        this.kpiApi.getKpis({ from: '2026-01-01', to: '2026-12-31' }).catch(() => null),
        this.incidentApi.getAll().catch(() => ({ items: [] })),
        this.ncApi.getAll().catch(() => ({ items: [] })),
        this.inspectionApi.getAll().catch(() => ({ items: [] })),
        this.formationApi.getAll().catch(() => ({ items: [] })),
      ]);
      this.kpis.set(
        buildHseDashboardKpis({
          api,
          incidents: incidentsRes.items,
          ncs: ncsRes.items,
          inspections: inspectionsRes.items,
          formations: formationsRes.items,
        }),
      );
    } catch {
      this.kpis.set(emptyHseDashboardKpis());
    }
  }
}
