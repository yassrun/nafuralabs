import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import {
  MaterielAffectationApiService,
  apiToAffectationChantier,
} from '@applications/erp/inventory/services/materiel-affectation-api.service';
import type { AffectationChantier } from '@applications/erp/inventory/models';

@Component({
  selector: 'app-affectations',
  standalone: true,
  imports: [CommonModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header
        [config]="{
          title: 'Affectations chantier',
          subtitle: summary(),
          breadcrumbs: [
            { label: 'Stock & Logistique', route: '/inventory/suivi/etat-stock' },
            { label: 'Matériel & Équipements' },
            { label: 'Affectations chantier' }
          ]
        }">
      </nf-page-header>

      <section class="affectations-card">
        <table>
          <thead>
            <tr>
              <th>Matériel</th>
              <th>Chantier</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (item of affectations(); track item.id) {
              <tr>
                <td>
                  <strong>{{ item.materielName || item.materielId }}</strong>
                </td>
                <td>{{ item.chantierRef }}</td>
                <td>{{ item.dateDebut }}</td>
                <td>{{ item.dateFin || 'En cours' }}</td>
                <td>
                  <span class="status" [class.status--active]="item.status === 'AFFECTE'">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty">Aucune affectation disponible.</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </nf-page-shell>
  `,
  styles: [
    `
      .affectations-card {
        border: 1px solid var(--nf-color-border);
        border-radius: 0.75rem;
        background: var(--nf-color-surface);
        overflow: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 0.75rem 0.875rem;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        text-align: left;
      }

      th {
        background: var(--nf-color-bg-subtle);
        color: var(--nf-color-text-secondary);
        font-weight: 600;
      }

      .status {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        background: var(--nf-color-border);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status--active {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
      }

      .empty {
        text-align: center;
        color: var(--nf-color-text-secondary);
      }
    `,
  ],
})
export class AffectationsPage implements OnInit {
  private readonly api = inject(MaterielAffectationApiService);

  readonly affectations = signal<AffectationChantier[]>([]);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const rows = await this.api.list();
    this.affectations.set(rows.map(apiToAffectationChantier));
  }

  readonly summary = computed(() => {
    const list = this.affectations();
    const active = list.filter((a) => a.status === 'AFFECTE').length;
    return `${list.length} affectation(s) — ${active} en cours`;
  });
}
