import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import type { CarnetCarburant, PleinCarburant } from '@applications/erp/inventory/models';
import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-pleins-carburant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, ButtonComponent],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="header()"></nf-page-header>

      <section class="form-card">
        <h3>{{ 'materielGmao.fuel.quickAdd' | translate }}</h3>
        <div class="row">
          <label>{{ 'materielGmao.table.carnet' | translate }}</label>
          <select [(ngModel)]="draft.carnetId">
            @for (c of carnets(); track c.id) {
              <option [value]="c.id">{{ c.engineId }} ({{ c.capaciteReservoir }} L)</option>
            }
          </select>
        </div>
        <div class="row">
          <label>{{ 'materielGmao.fuel.litres' | translate }}</label>
          <input type="number" [(ngModel)]="draft.litres" min="1" step="1" />
        </div>
        <div class="row">
          <label>{{ 'materielGmao.fuel.jaugeDebut' | translate }}</label>
          <input type="number" [(ngModel)]="draft.jaugeDebut" min="0" step="1" />
        </div>
        <div class="row">
          <label>{{ 'materielGmao.fuel.prixLitre' | translate }}</label>
          <input type="number" [(ngModel)]="draft.prixLitre" min="0" step="0.01" />
        </div>
        <nf-button type="button" class="btn" (clicked)="submit()" variant="secondary">{{ 'materielGmao.actions.save' | translate }}</nf-button>
        @if (lastMsg()) {
          <p class="msg">{{ lastMsg() }}</p>
        }
      </section>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>{{ 'materielGmao.table.date' | translate }}</th>
              <th>{{ 'materielGmao.table.engine' | translate }}</th>
              <th>{{ 'materielGmao.fuel.litres' | translate }}</th>
              <th>{{ 'materielGmao.fuel.total' | translate }}</th>
              <th>{{ 'materielGmao.fuel.anomaly' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (p of pleins(); track p.id) {
              <tr [class.anomaly]="p.anomalie">
                <td>{{ p.date }}</td>
                <td>{{ p.engineId }}</td>
                <td>{{ p.litres }}</td>
                <td>{{ p.total | mad }}</td>
                <td>{{ p.anomalie ? ('materielGmao.labels.yes' | translate) : ('materielGmao.labels.no' | translate) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <nf-button type="button" class="btn secondary" (clicked)="exportCsv()" variant="secondary">
        {{ 'materielGmao.fuel.exportCsv' | translate }}
      </nf-button>
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
        min-width: 8rem;
        color: var(--nf-color-text-secondary);
        font-size: 0.85rem;
      }
      input,
      select {
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
      .btn.secondary {
        background: var(--nf-color-bg-muted);
        color: var(--nf-text-primary);
        border: 1px solid var(--nf-color-border);
        margin-top: 0.75rem;
      }
      .msg {
        margin: 0.5rem 0 0;
        color: var(--nf-color-success-700);
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
      tr.anomaly td {
        background: var(--nf-color-danger-50);
        color: var(--nf-color-danger-700);
      }
    `,
  ],
})
export class PleinsCarburantPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  readonly carnets = toSignal(this.gmao.getCarnets(), { initialValue: [] as CarnetCarburant[] });

  readonly pleins = signal<PleinCarburant[]>([]);

  readonly draft = {
    carnetId: '',
    litres: 120,
    jaugeDebut: 40,
    prixLitre: 11.2,
  };

  readonly lastMsg = signal('');

  readonly header = computed(() => ({
    title: 'materielGmao.fuel.pleinsTitle',
    subtitle: 'materielGmao.fuel.pleinsSubtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.fuel.pleinsTitle') },
    ],
  }));

  constructor() {
    const qp = this.route.snapshot.queryParamMap.get('carnet');
    this.gmao.getCarnets().subscribe((c) => {
      this.draft.carnetId = qp ?? c[0]?.id ?? '';
    });
    this.reloadPleins();
  }

  private reloadPleins(): void {
    this.gmao.getPleins().subscribe((p) => this.pleins.set(p));
  }

  submit(): void {
    const carnetId = this.draft.carnetId || this.carnets()[0]?.id;
    if (!carnetId) {
      this.lastMsg.set(this.translate.instant('materielGmao.fuel.noCarnet'));
      return;
    }
    const carnet = this.carnets().find((c) => c.id === carnetId);
    const engineId = carnet?.engineId ?? '';
    const jFin = Math.min(
      (carnet?.capaciteReservoir ?? 0) - 1,
      this.draft.jaugeDebut + this.draft.litres,
    );
    this.gmao.addPlein({
      carnetId,
      engineId,
      date: new Date().toISOString().slice(0, 10),
      litres: this.draft.litres,
      prixLitre: this.draft.prixLitre,
      jaugeDebut: this.draft.jaugeDebut,
      jaugeFin: jFin,
    });
    this.lastMsg.set(this.translate.instant('materielGmao.fuel.saved'));
    this.reloadPleins();
  }

  exportCsv(): void {
    const blob = new Blob([this.gmao.exportPleinsCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pleins-carburant.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
