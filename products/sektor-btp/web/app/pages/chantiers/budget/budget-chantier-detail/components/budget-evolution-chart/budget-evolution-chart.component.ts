import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { BudgetMonthlyPoint } from '../../../models';

@Component({
  selector: 'app-budget-evolution-chart',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe, TranslateModule],
  template: `
    <section class="chart-card">
      <header>
        <h3>{{ 'chantiers.budget.detail.tabs.evolution' | translate }}</h3>
        <p>{{ 'chantiers.budget.evolution.subtitle' | translate }}</p>
      </header>

      <div class="chart-grid">
        @for (point of points(); track point.month) {
          <article>
            <div class="bars">
              <span class="budget" [style.height.%]="height(point.budgetHt)"></span>
              <span class="engage" [style.height.%]="height(point.engageHt)"></span>
              <span class="realise" [style.height.%]="height(point.realiseHt)"></span>
            </div>
            <strong>{{ point.month }}</strong>
            <small>{{ point.realiseHt | mad }}</small>
          </article>
        }
      </div>

      <footer>
        <span><i class="legend legend--budget"></i> Budget</span>
        <span><i class="legend legend--engage"></i> Engage</span>
        <span><i class="legend legend--realise"></i> Realise</span>
      </footer>
    </section>
  `,
  styles: [`
    .chart-card { display: grid; gap: 1rem; padding: 1.25rem; border: 1px solid var(--nf-color-border); background: var(--nf-color-surface); border-radius: 1rem; }
    header h3 { margin: 0; color: var(--nf-text-primary); }
    header p { margin: 0.35rem 0 0; color: var(--nf-color-text-secondary); }
    .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr)); gap: 1rem; min-height: 18rem; align-items: end; }
    article { display: grid; gap: 0.5rem; justify-items: center; }
    .bars { width: 100%; min-height: 14rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem; align-items: end; }
    .bars span { border-radius: 0.5rem 0.5rem 0 0; }
    .budget { background: var(--nf-color-border); }
    .engage { background: var(--nf-color-warning-600); }
    .realise { background: var(--nf-color-primary-600); }
    strong { color: var(--nf-text-primary); }
    small { color: var(--nf-color-text-secondary); text-align: center; }
    footer { display: flex; flex-wrap: wrap; gap: 1rem; color: var(--nf-color-text-secondary); }
    .legend { display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: 999px; margin-right: 0.45rem; }
    .legend--budget { background: var(--nf-color-border); }
    .legend--engage { background: var(--nf-color-warning-600); }
    .legend--realise { background: var(--nf-color-primary-600); }
  `],
})
export class BudgetEvolutionChartComponent {
  readonly points = input.required<BudgetMonthlyPoint[]>();

  private readonly max = computed(() => Math.max(...this.points().map((point) => point.budgetHt), 1));

  height(value: number): number {
    return (value / this.max()) * 100;
  }
}
