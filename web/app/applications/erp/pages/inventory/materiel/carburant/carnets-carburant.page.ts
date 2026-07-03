import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-carnets-carburant',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="header()"></nf-page-header>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>{{ 'materielGmao.table.engine' | translate }}</th>
              <th>{{ 'materielGmao.fuel.capacity' | translate }}</th>
              <th>{{ 'materielGmao.fuel.type' | translate }}</th>
              <th>{{ 'materielGmao.fuel.target' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of carnets(); track c.id) {
              <tr>
                <td>{{ c.engineId }}</td>
                <td>{{ c.capaciteReservoir }} L</td>
                <td>{{ c.typeCarburant }}</td>
                <td>{{ c.consommationCible }} L/h</td>
                <td>
                  <a [routerLink]="['/materiel/carburant/pleins']" [queryParams]="{ carnet: c.id }">{{
                    'materielGmao.fuel.pleins' | translate
                  }}</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [
    `
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
      a {
        color: var(--nf-color-primary-700);
        font-weight: 600;
      }
    `,
  ],
})
export class CarnetsCarburantPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly carnets = toSignal(this.gmao.getCarnets(), { initialValue: [] });

  readonly header = computed(() => ({
    title: 'materielGmao.fuel.carnetsTitle',
    subtitle: 'materielGmao.fuel.carnetsSubtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.fuel.carnetsTitle') },
    ],
  }));
}
