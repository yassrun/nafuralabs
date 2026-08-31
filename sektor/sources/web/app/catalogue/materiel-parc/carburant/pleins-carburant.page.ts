
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  type LookupSearchFn,
  PageHeaderComponent,
  PageShellComponent,
} from '@platform/lib/anatomy';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import type { PleinCarburant } from '@app/catalogue/models';
import { MaterielGmaoFacadeService } from '@app/catalogue/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-pleins-carburant',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    MadCurrencyPipe,
    ButtonComponent,
    NfSelectComponent,
  ],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="header()"></nf-page-header>

      <section class="form-card" data-testid="pleins-carburant-form">
        <h3>{{ 'materielGmao.fuel.quickAdd' | translate }}</h3>
        <div class="row">
          <nf-select
            class="fld"
            [label]="'materielGmao.table.engine' | translate"
            lookupKey="materiels"
            placeholder="Taper ≥ 2 car. — engin…"
            [lookupSearch]="searchMateriels"
            [(ngModel)]="draft.engineId"
            (ngModelChange)="onEngineChange($event)"
            name="engineId"
            [selectedLabel]="draft.engineLabel"
            data-testid="pleins-engin-combobox"
          />
        </div>
        @if (draft.engineId) {
          <div class="row">
            <label for="plein-carnet">{{ 'materielGmao.table.carnet' | translate }}</label>
            <select
              id="plein-carnet"
              [(ngModel)]="draft.carnetId"
              name="carnetId"
              data-testid="pleins-carnet-select"
            >
              @for (c of carnetsForEngine(); track c.id) {
                <option [value]="c.id">{{ c.capaciteReservoir }} L · {{ c.typeCarburant }}</option>
              }
            </select>
          </div>
        } @else {
          <p class="hint">{{ 'materielGmao.fuel.selectEngineFirst' | translate }}</p>
        }
        <div class="row">
          <label for="plein-litres">{{ 'materielGmao.fuel.litres' | translate }}</label>
          <input id="plein-litres" type="number" [(ngModel)]="draft.litres" name="litres" min="1" step="1" />
        </div>
        <div class="row">
          <label for="plein-jauge">{{ 'materielGmao.fuel.jaugeDebut' | translate }}</label>
          <input id="plein-jauge" type="number" [(ngModel)]="draft.jaugeDebut" name="jaugeDebut" min="0" step="1" />
        </div>
        <div class="row">
          <label for="plein-prix">{{ 'materielGmao.fuel.prixLitre' | translate }}</label>
          <input id="plein-prix" type="number" [(ngModel)]="draft.prixLitre" name="prixLitre" min="0" step="0.01" />
        </div>
        <nf-button type="button" class="btn" (clicked)="submit()" variant="secondary">
          {{ 'materielGmao.actions.save' | translate }}
        </nf-button>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      .fld {
        flex: 1;
        min-width: 14rem;
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
      .hint {
        margin: 0 0 0.5rem;
        color: var(--nf-color-text-secondary);
        font-size: 0.85rem;
      }
      .btn {
        margin-top: 0.35rem;
      }
      .btn.secondary {
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
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  readonly pleins = signal<PleinCarburant[]>([]);
  readonly carnetsRevision = signal(0);

  readonly searchMateriels: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['materiels']?.(q) ?? Promise.resolve([]));
    this.materielHits = hits;
    return hits;
  };

  private materielHits: Array<{ value: string; label: string }> = [];

  readonly draft = {
    engineId: '',
    engineLabel: '',
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

  readonly carnetsForEngine = computed(() => {
    this.carnetsRevision();
    return this.gmao.getCarnetsForEngine(this.draft.engineId);
  });

  constructor() {
    const qpCarnet = this.route.snapshot.queryParamMap.get('carnet');
    if (qpCarnet) {
      this.gmao.getCarnets().subscribe((all) => {
        const hit = all.find((c) => c.id === qpCarnet);
        if (hit) {
          this.draft.engineId = hit.engineId;
          this.draft.carnetId = hit.id;
          this.carnetsRevision.update((n) => n + 1);
        }
      });
    }
    this.reloadPleins();
  }

  onEngineChange(engineId: string): void {
    this.draft.engineId = engineId ?? '';
    const hit = this.materielHits.find((h) => h.value === engineId);
    this.draft.engineLabel = hit?.label ?? '';
    this.draft.carnetId = '';
    if (this.draft.engineId) {
      const carnet = this.gmao.ensureDefaultCarnet(this.draft.engineId);
      this.draft.carnetId = carnet.id;
    }
    this.carnetsRevision.update((n) => n + 1);
  }

  private reloadPleins(): void {
    this.gmao.getPleins().subscribe((p) => this.pleins.set(p));
  }

  submit(): void {
    const carnetId = this.draft.carnetId || this.carnetsForEngine()[0]?.id;
    if (!this.draft.engineId.trim()) {
      this.lastMsg.set(this.translate.instant('materielGmao.fuel.selectEngineFirst'));
      return;
    }
    if (!carnetId) {
      this.lastMsg.set(this.translate.instant('materielGmao.fuel.noCarnet'));
      return;
    }
    const carnet = this.carnetsForEngine().find((c) => c.id === carnetId);
    const engineId = this.draft.engineId;
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
