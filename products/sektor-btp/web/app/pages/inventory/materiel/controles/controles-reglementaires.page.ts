import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-controles-reglementaires',
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
              <th>{{ 'materielGmao.controles.type' | translate }}</th>
              <th>{{ 'materielGmao.controles.libelle' | translate }}</th>
              <th>{{ 'materielGmao.controles.expiration' | translate }}</th>
              <th>{{ 'materielGmao.controles.blocking' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (c of rows(); track c.id) {
              <tr [class.expired]="isExpired(c.dateExpiration)">
                <td>{{ c.engineId }}</td>
                <td>{{ c.type }}</td>
                <td>{{ c.libelle }}</td>
                <td>{{ c.dateExpiration }}</td>
                <td>{{ c.bloqueAffectationSiExpire ? ('materielGmao.labels.yes' | translate) : ('materielGmao.labels.no' | translate) }}</td>
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
        padding: 0.55rem 0.65rem;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        text-align: left;
      }
      th {
        background: var(--nf-color-bg-subtle);
        font-size: 0.78rem;
        color: var(--nf-color-text-secondary);
      }
      tr.expired td {
        background: var(--nf-color-danger-50);
        color: var(--nf-color-danger-700);
      }
    `,
  ],
})
export class ControlesReglementairesPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly rows = toSignal(this.gmao.getControles(), { initialValue: [] });

  readonly header = computed(() => ({
    title: 'materielGmao.controles.title',
    subtitle: 'materielGmao.controles.subtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.controles.title') },
    ],
  }));

  isExpired(iso: string): boolean {
    return iso < new Date().toISOString().slice(0, 10);
  }
}
