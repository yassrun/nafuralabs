import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import type { PointageEngin } from '@applications/erp/inventory/models';
import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-pointage-engin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="header()"></nf-page-header>

      <section class="form-card">
        <h3>{{ 'materielGmao.pointage.quick' | translate }}</h3>
        <div class="row">
          <label>{{ 'materielGmao.table.engine' | translate }}</label>
          <input type="text" [(ngModel)]="draft.engineId" />
        </div>
        <div class="row">
          <label>{{ 'materielGmao.table.chantier' | translate }}</label>
          <input type="text" [(ngModel)]="draft.chantierRef" />
        </div>
        <div class="row">
          <label>{{ 'materielGmao.pointage.heures' | translate }}</label>
          <input type="number" [(ngModel)]="draft.heures" min="0.5" step="0.5" />
        </div>
        <nf-button type="button" class="btn" (clicked)="save()" variant="secondary">{{ 'materielGmao.actions.save' | translate }}</nf-button>
      </section>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>{{ 'materielGmao.table.date' | translate }}</th>
              <th>{{ 'materielGmao.table.engine' | translate }}</th>
              <th>{{ 'materielGmao.table.chantier' | translate }}</th>
              <th>{{ 'materielGmao.pointage.heures' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (p of rows(); track p.id) {
              <tr>
                <td>{{ p.date }}</td>
                <td>{{ p.engineId }}</td>
                <td>{{ p.chantierRef }}</td>
                <td>{{ p.heuresFonctionnement }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [
    `
      .form-card {
        border: 1px solid var(--nf-color-border);
        border-radius: 0.75rem;
        padding: 0.85rem;
        margin-bottom: 0.75rem;
        background: var(--nf-color-surface);
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      label {
        min-width: 7rem;
        color: var(--nf-color-text-secondary);
        font-size: 0.85rem;
      }
      input {
        flex: 1;
        min-width: 8rem;
        padding: 0.35rem 0.5rem;
        border: 1px solid var(--nf-color-border);
        border-radius: 0.35rem;
      }
      .btn {
        margin-top: 0.35rem;
        padding: 0.45rem 0.85rem;
        border-radius: 0.4rem;
        border: none;
        background: var(--nf-color-primary-700);
        color: var(--nf-color-surface);
        font-weight: 600;
        cursor: pointer;
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
export class PointageEnginPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly rows = signal<PointageEngin[]>([]);

  readonly draft = {
    engineId: 'mat-001',
    chantierRef: 'PROJ-2024-001',
    heures: 8,
  };

  readonly header = computed(() => ({
    title: 'materielGmao.pointage.title',
    subtitle: 'materielGmao.pointage.subtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.pointage.title') },
    ],
  }));

  constructor() {
    this.gmao.getPointages().subscribe((p) => this.rows.set(p));
  }

  save(): void {
    const row: PointageEngin = {
      id: `pe-${Date.now()}`,
      engineId: this.draft.engineId,
      chantierId: 'ch-001',
      chantierRef: this.draft.chantierRef,
      date: new Date().toISOString().slice(0, 10),
      heuresFonctionnement: this.draft.heures,
    };
    this.gmao.addPointage(row);
    this.rows.set([row, ...this.rows()]);
  }
}
