import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-plans-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="header()">
      </nf-page-header>

      @if (weeklyDue() >= 3) {
        <div class="banner" role="status">
          {{ 'materielGmao.maintenance.alertWeek' | translate: { count: weeklyDue() } }}
        </div>
      }

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>{{ 'materielGmao.table.engine' | translate }}</th>
              <th>{{ 'materielGmao.table.intervention' | translate }}</th>
              <th>{{ 'materielGmao.table.trigger' | translate }}</th>
              <th>{{ 'materielGmao.table.threshold' | translate }}</th>
              <th>{{ 'materielGmao.table.nextDue' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of plans(); track p.id) {
              <tr>
                <td>{{ p.engineId }}</td>
                <td>{{ p.typeIntervention }}</td>
                <td>{{ p.declencheur }}</td>
                <td>{{ p.seuil }}</td>
                <td>{{ p.prochaineEcheanceIso || p.prochainSeuil }}</td>
                <td>
                  <a [routerLink]="['/materiel/maintenance/historique', p.engineId]">{{
                    'materielGmao.actions.history' | translate
                  }}</a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">{{ 'materielGmao.empty.plans' | translate }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p class="hint">
        <a routerLink="/materiel/maintenance/ot">{{ 'materielGmao.maintenance.gotoOt' | translate }}</a>
      </p>
    </nf-page-shell>
  `,
  styles: [
    `
      .banner {
        margin-bottom: 0.75rem;
        padding: 0.65rem 0.85rem;
        border-radius: 0.5rem;
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-700);
        font-weight: 600;
      }
      .card {
        border: 1px solid var(--nf-color-border);
        border-radius: 0.75rem;
        overflow: auto;
        background: var(--nf-color-surface);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 0.65rem 0.75rem;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        text-align: left;
      }
      th {
        background: var(--nf-color-bg-subtle);
        font-size: 0.8rem;
        color: var(--nf-color-text-secondary);
      }
      .hint {
        margin-top: 0.75rem;
      }
      .hint a {
        color: var(--nf-color-primary-700);
        font-weight: 600;
      }
    `,
  ],
})
export class PlansMaintenancePage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly plans = toSignal(this.gmao.getPlans(), { initialValue: [] });

  readonly weeklyDue = computed(() => this.gmao.getWeeklyMaintenanceDueCount());

  readonly header = computed(() => ({
    title: 'materielGmao.maintenance.plansTitle',
    subtitle: 'materielGmao.maintenance.plansSubtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.maintenance.plansTitle') },
    ],
  }));
}
