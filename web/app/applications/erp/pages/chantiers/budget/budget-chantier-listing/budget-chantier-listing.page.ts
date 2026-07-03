import { CommonModule, PercentPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { ConsommationProgressComponent } from '../components/consommation-progress/consommation-progress.component';
import { BudgetFacade } from '../services';

@Component({
  selector: 'app-budget-chantier-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MadCurrencyPipe, PercentPipe, ConsommationProgressComponent, TranslateModule],
  template: `
    <section class="budget-page">
      <header class="budget-hero">
        <div>
          <p class="budget-eyebrow">Chantiers · Budget vs réalisé</p>
          <h1>{{ 'chantiers.budget.list.headerTitle' | translate }}</h1>
          <p class="budget-subtitle">{{ 'chantiers.budget.list.headerSubtitle' | translate }}</p>
        </div>
        <div class="budget-kpis">
          <article>
            <span>Budget révisé</span>
            <strong>{{ facade.kpis().revise | mad }}</strong>
          </article>
          <article>
            <span>{{ 'chantiers.budget.list.kpis.realise' | translate }}</span>
            <strong>{{ facade.kpis().realise | mad }}</strong>
          </article>
          <article>
            <span>Alertes</span>
            <strong>{{ facade.kpis().alerts }}</strong>
          </article>
        </div>
      </header>

      <section class="budget-filters">
        <label><input type="checkbox" [ngModel]="statusEnabled('EN_COURS')" (ngModelChange)="facade.toggleStatus('EN_COURS', $event)" /> {{ 'chantiers.budget.list.filters.enCours' | translate }}</label>
        <label><input type="checkbox" [ngModel]="statusEnabled('SUSPENDU')" (ngModelChange)="facade.toggleStatus('SUSPENDU', $event)" /> Suspendu</label>
        <label><input type="checkbox" [ngModel]="statusEnabled('TERMINE')" (ngModelChange)="facade.toggleStatus('TERMINE', $event)" /> Terminé</label>

        <select [ngModel]="facade.filters().consommationRange" (ngModelChange)="facade.setFilters({ consommationRange: $event })">
          <option value="TOUS">{{ 'chantiers.budget.list.filters.toutesConsommations' | translate }}</option>
          <option value="LOW">&lt; 70%</option>
          <option value="MID">70% - 90%</option>
          <option value="HIGH">90% - 100%</option>
          <option value="OVER">&gt; 100%</option>
        </select>

        <select [ngModel]="facade.filters().margeRange" (ngModelChange)="facade.setFilters({ margeRange: $event })">
          <option value="TOUS">{{ 'chantiers.budget.list.filters.toutesMarges' | translate }}</option>
          <option value="NEGATIVE">Marge négative</option>
          <option value="LOW">Marge &lt; 8%</option>
          <option value="HEALTHY">Marge saine</option>
        </select>

        <label><input type="checkbox" [ngModel]="facade.filters().enAlerte" (ngModelChange)="facade.setFilters({ enAlerte: $event })" /> {{ 'chantiers.budget.list.filters.enAlerte' | translate }}</label>
      </section>

      <section class="budget-table-wrap">
        <table class="budget-table">
          <thead>
            <tr>
              <th>Chantier</th>
              <th>Révisé</th>
              <th>Engagé</th>
              <th>{{ 'chantiers.budget.list.kpis.realise' | translate }}</th>
              <th>Consommation</th>
              <th>Marge projetée</th>
              <th>Alerte</th>
            </tr>
          </thead>
          <tbody>
            @for (budget of facade.filteredBudgets(); track budget.id) {
              <tr>
                <td>
                  <a [routerLink]="['/chantiers/budget', budget.id]">{{ budget.code }}</a>
                  <div class="designation">{{ budget.name }}</div>
                  <div class="designation-meta">{{ budget.client }}</div>
                </td>
                <td>{{ budget.budgetReviseHt | mad }}</td>
                <td>{{ budget.engageHt | mad }}</td>
                <td>{{ budget.realiseHt | mad }}</td>
                <td>
                  <app-consommation-progress [value]="budget.consommationPercent"></app-consommation-progress>
                </td>
                <td [class.negative]="budget.margeProjeteePercent < 0" [class.positive]="budget.margeProjeteePercent >= 0">{{ budget.margeProjeteePercent | percent:'1.1-1' }}</td>
                <td>
                  @if (budget.alerte) {
                    <span class="alert-dot" [title]="budget.alertMessage || ''">!</span>
                  } @else {
                    <span class="alert-dot alert-dot--muted">-</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .budget-page { padding: 1.5rem; display: grid; gap: 1.5rem; }
    .budget-hero { display: flex; justify-content: space-between; gap: 1.5rem; padding: 1.5rem; border-radius: 1.25rem; background: linear-gradient(135deg, var(--nf-color-primary-800), var(--nf-color-primary-600)); color: var(--nf-color-bg-subtle); }
    .budget-eyebrow { margin: 0 0 0.35rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.75rem; opacity: 0.72; }
    .budget-hero h1 { margin: 0; font-size: 2rem; }
    .budget-subtitle { margin: 0.5rem 0 0; max-width: 52rem; color: rgba(244, 246, 244, 0.8); }
    .budget-kpis { display: grid; grid-template-columns: repeat(3, minmax(8rem, 1fr)); gap: 0.75rem; min-width: min(30rem, 100%); }
    .budget-kpis article { padding: 1rem; border-radius: 1rem; background: rgba(255,255,255,0.08); backdrop-filter: blur(8px); }
    .budget-kpis span { display: block; font-size: 0.75rem; color: rgba(244,246,244,0.75); }
    .budget-kpis strong { display: block; margin-top: 0.35rem; font-size: 1.15rem; }
    .budget-filters { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; padding: 1rem 1.25rem; border-radius: 1rem; background: var(--nf-color-bg-muted); }
    .budget-filters label { display: inline-flex; gap: 0.45rem; align-items: center; font-weight: 600; color: var(--nf-color-text-secondary); }
    .budget-filters select { border: 1px solid var(--nf-color-border); background: var(--nf-color-surface); border-radius: 999px; padding: 0.5rem 0.85rem; }
    .budget-table-wrap { overflow: auto; border-radius: 1rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); }
    .budget-table { width: 100%; border-collapse: collapse; min-width: 56rem; }
    .budget-table th, .budget-table td { padding: 0.9rem 1rem; border-bottom: 1px solid var(--nf-color-border); text-align: left; }
    .budget-table th { position: sticky; top: 0; background: var(--nf-color-bg-subtle); z-index: 1; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--nf-color-text-secondary); }
    .designation { font-weight: 700; color: var(--nf-text-primary); }
    .designation-meta { font-size: 0.8rem; color: var(--nf-color-text-secondary); }
    .positive { color: var(--nf-color-success-700); font-weight: 700; }
    .negative { color: var(--nf-color-danger-700); font-weight: 700; }
    .alert-dot { display: inline-grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: 999px; background: var(--nf-color-warning-600); color: var(--nf-color-surface); font-weight: 700; }
    .alert-dot--muted { background: var(--nf-color-border); color: var(--nf-color-text-secondary); }
    a { color: var(--nf-color-primary-600); font-weight: 700; text-decoration: none; }
    @media (max-width: 960px) {
      .budget-hero { grid-template-columns: 1fr; display: grid; }
      .budget-kpis { grid-template-columns: 1fr; }
    }
  `],
})
export class BudgetChantierListingPage implements OnInit {
  readonly facade = inject(BudgetFacade);
  private readonly route = inject(ActivatedRoute);
  readonly statusEnabled = (status: 'EN_COURS' | 'TERMINE' | 'SUSPENDU') => this.facade.filters().statuses.includes(status);

  ngOnInit(): void {
    const chantierId = this.route.snapshot.queryParamMap.get('chantierId');
    void this.facade.loadListingFromApi(chantierId ?? undefined);
  }
}
