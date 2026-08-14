import { CommonModule, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { BudgetEngagement } from '../../../models';

@Component({
  selector: 'app-engagements-list',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe, DatePipe, TranslateModule],
  template: `
    <section class="card">
      <header>
        <h3>{{ 'chantiers.budget.detail.tabs.engagements' | translate }}</h3>
        <p>{{ 'chantiers.budget.engagements.subtitle' | translate }}</p>
      </header>
      <table>
        <thead>
          <tr>
            <th>{{ 'chantiers.budget.engagements.columns.reference' | translate }}</th>
            <th>Fournisseur</th>
            <th>Rubrique</th>
            <th>{{ 'chantiers.budget.engagements.columns.montant' | translate }}</th>
            <th>Statut</th>
            <th>{{ 'chantiers.budget.engagements.columns.date' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (engagement of engagements(); track engagement.id) {
            <tr>
              <td>{{ engagement.reference }}</td>
              <td>{{ engagement.fournisseur }}</td>
              <td>{{ engagement.rubrique }}</td>
              <td>{{ engagement.montantHt | mad }}</td>
              <td><span class="status">{{ engagement.statut }}</span></td>
              <td>{{ engagement.date | date:'dd/MM/yyyy' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="empty">{{ 'chantiers.budget.engagements.empty' | translate }}</td></tr>
          }
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .card { display: grid; gap: 1rem; padding: 1.25rem; border: 1px solid var(--nf-color-border); background: var(--nf-color-surface); border-radius: 1rem; }
    header h3 { margin: 0; color: var(--nf-text-primary); }
    header p { margin: 0.35rem 0 0; color: var(--nf-color-text-secondary); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.85rem 0.75rem; border-bottom: 1px solid var(--nf-color-border); text-align: left; }
    th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--nf-color-text-secondary); }
    .status { padding: 0.25rem 0.6rem; border-radius: 999px; background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); font-weight: 700; }
    .empty { text-align: center; color: var(--nf-color-text-secondary); }
  `],
})
export class EngagementsListComponent {
  readonly engagements = input.required<BudgetEngagement[]>();
}
