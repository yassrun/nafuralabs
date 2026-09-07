
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { MaterielGmaoFacadeService } from '@app/catalogue/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-etats-contradictoires',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>{{ 'materielGmao.table.date' | translate }}</th>
            <th>{{ 'materielGmao.locations.etatType' | translate }}</th>
            <th>{{ 'materielGmao.table.contrat' | translate }}</th>
            <th>{{ 'materielGmao.locations.signatures' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (e of etats(); track e.id) {
            <tr>
              <td>{{ e.date }}</td>
              <td>{{ e.type }}</td>
              <td>{{ e.contratId }}</td>
              <td>{{ e.signataireInterne || '—' }} / {{ e.signataireLoueur || '—' }}</td>
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
export class EtatsContradictoiresPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);

  readonly etats = toSignal(this.gmao.getEtats(), { initialValue: [] });
}
