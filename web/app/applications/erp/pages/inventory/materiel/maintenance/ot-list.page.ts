import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

@Component({
  selector: 'app-ot-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="header()">
      </nf-page-header>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>{{ 'materielGmao.table.numero' | translate }}</th>
              <th>{{ 'materielGmao.table.engine' | translate }}</th>
              <th>{{ 'materielGmao.table.type' | translate }}</th>
              <th>{{ 'materielGmao.table.status' | translate }}</th>
              <th>{{ 'materielGmao.table.total' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (o of ots(); track o.id) {
              <tr>
                <td>{{ o.numero }}</td>
                <td>{{ o.engineId }}</td>
                <td>{{ o.type }}</td>
                <td>{{ o.status }}</td>
                <td>{{ o.coutTotal | mad }}</td>
                <td>
                  <a [routerLink]="['/materiel/maintenance/ot', o.id]">{{ 'materielGmao.actions.open' | translate }}</a>
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
export class OtListPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly ots = toSignal(this.gmao.getOrdresTravail(), { initialValue: [] });

  readonly header = computed(() => ({
    title: 'materielGmao.ot.listTitle',
    subtitle: 'materielGmao.ot.listSubtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.ot.listTitle') },
    ],
  }));
}
