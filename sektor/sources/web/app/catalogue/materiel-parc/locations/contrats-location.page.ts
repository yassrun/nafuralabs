
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import { MaterielGmaoFacadeService } from '@app/catalogue/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-contrats-location',
  standalone: true,
  imports: [TranslateModule, MadCurrencyPipe],
  template: `
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
  changeDetection: ChangeDetectionStrategy.Eager,
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

  readonly contrats = toSignal(this.gmao.getContrats(), { initialValue: [] });
}
