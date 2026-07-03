import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { PageHeaderComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import type { ContratLocation } from '@applications/erp/inventory/models';
import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

export type ContratAvecJours = ContratLocation & { _jours: number };

@Component({
  selector: 'app-echeances-location',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-header [config]="header()"></nf-page-header>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>{{ 'materielGmao.table.numero' | translate }}</th>
            <th>{{ 'materielGmao.locations.finLocation' | translate }}</th>
            <th>{{ 'materielGmao.locations.joursRestants' | translate }}</th>
            <th>{{ 'materielGmao.table.total' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (c of soon(); track c.id) {
            <tr [class.warn]="c._jours <= 7">
              <td>{{ c.numero }}</td>
              <td>{{ c.dateFin }}</td>
              <td>{{ c._jours }}</td>
              <td>{{ c.montantTotalEstime | mad }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4">{{ 'materielGmao.locations.noEcheance' | translate }}</td>
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
      tr.warn td {
        background: var(--nf-color-warning-50);
        color: var(--nf-color-warning-800);
        font-weight: 600;
      }
    `,
  ],
})
export class EcheancesLocationPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly soon = toSignal(
    this.gmao.getContrats().pipe(
      map((list) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return list
          .filter((c) => c.status === 'ACTIF')
          .map((c) => {
            const end = new Date(`${c.dateFin}T00:00:00`);
            const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000);
            return { ...c, _jours: diff } as ContratAvecJours;
          })
          .filter((c) => c._jours <= 30)
          .sort((a, b) => a._jours - b._jours);
      }),
    ),
    { initialValue: [] as ContratAvecJours[] },
  );

  readonly header = computed(() => ({
    title: 'materielGmao.locations.echeancesTitle',
    subtitle: 'materielGmao.locations.echeancesSubtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('nav.materiel.locations'), route: '/materiel/locations/contrats' },
      { label: this.translate.instant('materielGmao.locations.echeancesTitle') },
    ],
  }));
}
