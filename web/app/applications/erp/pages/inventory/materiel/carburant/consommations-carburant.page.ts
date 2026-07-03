import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import type { PleinCarburant } from '@applications/erp/inventory/models';
import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-consommations-carburant',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="header()"></nf-page-header>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>{{ 'materielGmao.table.engine' | translate }}</th>
              <th>{{ 'materielGmao.fuel.totalLitres' | translate }}</th>
              <th>{{ 'materielGmao.fuel.fillCount' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.engineId) {
              <tr>
                <td>{{ r.engineId }}</td>
                <td>{{ r.litres | number: '1.0-0' }} L</td>
                <td>{{ r.count }}</td>
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
    `,
  ],
})
export class ConsommationsCarburantPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly pleins = toSignal(this.gmao.getPleins(), { initialValue: [] as PleinCarburant[] });

  readonly rows = computed(() => {
    const map = new Map<string, { engineId: string; litres: number; count: number }>();
    for (const p of this.pleins()) {
      const cur = map.get(p.engineId) ?? { engineId: p.engineId, litres: 0, count: 0 };
      cur.litres += p.litres;
      cur.count += 1;
      map.set(p.engineId, cur);
    }
    return [...map.values()].sort((a, b) => b.litres - a.litres);
  });

  readonly header = computed(() => ({
    title: 'materielGmao.fuel.consommationsTitle',
    subtitle: 'materielGmao.fuel.consommationsSubtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.fuel.consommationsTitle') },
    ],
  }));
}
