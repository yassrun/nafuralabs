import { CommonModule, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { BudgetRevision } from '../../../models';

@Component({
  selector: 'app-revisions-history',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe, DatePipe, TranslateModule],
  template: `
    <section class="card">
      <header>
        <h3>{{ 'chantiers.budget.revisions.title' | translate }}</h3>
        <p>{{ 'chantiers.budget.revisions.subtitle' | translate }}</p>
      </header>
      <div class="timeline">
        @for (revision of revisions(); track revision.id) {
          <article>
            <div class="bullet"></div>
            <div class="content">
              <strong>{{ revision.date | date:'dd/MM/yyyy' }}</strong>
              <p>{{ revision.motif }}</p>
              <span>{{ revision.ancienBudgetTotal | mad }} → {{ revision.nouveauBudgetTotal | mad }}</span>
              @if (revision.pieceName) {
                <small>Pièce : {{ revision.pieceName }}</small>
              }
            </div>
          </article>
        } @empty {
          <p class="empty">{{ 'chantiers.budget.revisions.empty' | translate }}</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .card { display: grid; gap: 1rem; padding: 1.25rem; border: 1px solid var(--nf-color-border); background: var(--nf-color-surface); border-radius: 1rem; }
    header h3 { margin: 0; color: var(--nf-text-primary); }
    header p { margin: 0.35rem 0 0; color: var(--nf-color-text-secondary); }
    .timeline { display: grid; gap: 1rem; }
    article { display: grid; grid-template-columns: 1rem 1fr; gap: 1rem; }
    .bullet { width: 0.8rem; height: 0.8rem; border-radius: 999px; background: var(--nf-color-primary-600); margin-top: 0.45rem; }
    .content { display: grid; gap: 0.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--nf-color-border); }
    .content strong { color: var(--nf-text-primary); }
    .content p, .content span, .content small { margin: 0; color: var(--nf-color-text-secondary); }
    .empty { margin: 0; color: var(--nf-color-text-secondary); }
  `],
})
export class RevisionsHistoryComponent {
  readonly revisions = input.required<BudgetRevision[]>();
}
