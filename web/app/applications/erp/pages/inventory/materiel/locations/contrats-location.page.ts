import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { PageHeaderComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-contrats-location',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-header [config]="header()"></nf-page-header>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>{{ 'materielGmao.table.numero' | translate }}</th>
            <th>{{ 'materielGmao.locations.loueur' | translate }}</th>
            <th>{{ 'materielGmao.locations.enginDesc' | translate }}</th>
            <th>{{ 'materielGmao.table.period' | translate }}</th>
            <th>{{ 'materielGmao.table.status' | translate }}</th>
            <th>{{ 'materielGmao.table.total' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (c of contrats(); track c.id) {
            <tr>
              <td>{{ c.numero }}</td>
              <td>{{ c.loueurName || c.loueurId }}</td>
              <td>{{ c.engineDescription }}</td>
              <td>{{ c.dateDebut }} → {{ c.dateFin }}</td>
              <td>{{ c.status }}</td>
              <td>{{ c.montantTotalEstime | mad }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
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
        padding: 0.55rem 0.65rem;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        text-align: left;
      }
      th {
        background: var(--nf-color-bg-subtle);
        font-size: 0.78rem;
        color: var(--nf-color-text-secondary);
      }
    `,
  ],
})
export class ContratsLocationPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly contrats = toSignal(this.gmao.getContrats(), { initialValue: [] });

  readonly header = computed(() => ({
    title: 'materielGmao.locations.contratsTitle',
    subtitle: 'materielGmao.locations.contratsSubtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('nav.materiel.locations'), route: '/materiel/locations/contrats' },
      { label: this.translate.instant('materielGmao.locations.contratsTitle') },
    ],
  }));
}
