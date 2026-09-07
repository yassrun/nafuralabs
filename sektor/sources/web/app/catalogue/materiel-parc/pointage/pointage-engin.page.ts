
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  type LookupSearchFn,
  ScreenComponent,
} from '@platform/lib/anatomy';

import type { PointageEngin } from '@app/catalogue/models';
import { MaterielGmaoFacadeService } from '@app/catalogue/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-pointage-engin',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    ScreenComponent,
    ButtonComponent,
    NfSelectComponent,
  ],
  template: `
    <nf-screen [header]="header()" [scroll]="true">

      <section class="form-card" data-testid="pointage-engin-form">
        <h3>{{ 'materielGmao.pointage.quick' | translate }}</h3>
        <div class="row">
          <nf-select
            class="fld"
            [label]="'materielGmao.table.engine' | translate"
            lookupKey="materiels"
            placeholder="Taper ≥ 2 car. — code / nom…"
            [lookupSearch]="searchMateriels"
            [(ngModel)]="draft.engineId"
            (ngModelChange)="onEngineChange($event)"
            name="engineId"
            [selectedLabel]="draft.engineLabel"
            data-testid="pointage-engin-combobox"
          />
        </div>
        <div class="row">
          <nf-select
            class="fld"
            [label]="'materielGmao.table.chantier' | translate"
            lookupKey="chantiers"
            placeholder="Taper ≥ 2 car. — chantier…"
            [lookupSearch]="searchChantiers"
            [(ngModel)]="draft.chantierId"
            (ngModelChange)="onChantierChange($event)"
            name="chantierId"
            [selectedLabel]="draft.chantierLabel"
            data-testid="pointage-chantier-combobox"
          />
        </div>
        <div class="row">
          <label for="pe-heures">{{ 'materielGmao.pointage.heures' | translate }}</label>
          <input id="pe-heures" type="number" [(ngModel)]="draft.heures" name="heures" min="0.5" step="0.5" />
        </div>
        <nf-button type="button" class="btn" (clicked)="save()" variant="secondary">
          {{ 'materielGmao.actions.save' | translate }}
        </nf-button>
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
                <td>{{ p.engineLabel || p.engineId }}</td>
                <td>{{ p.chantierRef || p.chantierId }}</td>
                <td>{{ p.heuresFonctionnement }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </nf-screen>
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
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  readonly rows = signal<PointageEngin[]>([]);

  readonly searchMateriels: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['materiels']?.(q) ?? Promise.resolve([]));
    this.materielHits = hits;
    return hits;
  };

  readonly searchChantiers: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['chantiers']?.(q) ?? Promise.resolve([]));
    this.chantierHits = hits;
    return hits;
  };

  private materielHits: Array<{ value: string; label: string }> = [];
  private chantierHits: Array<{ value: string; label: string }> = [];

  readonly draft = {
    engineId: '',
    engineLabel: '',
    chantierId: '',
    chantierLabel: '',
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

  onEngineChange(value: string): void {
    this.draft.engineId = value ?? '';
    const hit = this.materielHits.find((h) => h.value === value);
    this.draft.engineLabel = hit?.label ?? '';
  }

  onChantierChange(value: string): void {
    this.draft.chantierId = value ?? '';
    const hit = this.chantierHits.find((h) => h.value === value);
    this.draft.chantierLabel = hit?.label ?? '';
  }

  save(): void {
    if (!this.draft.engineId.trim() || !this.draft.chantierId.trim()) {
      return;
    }
    const row: PointageEngin = {
      id: `pe-${Date.now()}`,
      engineId: this.draft.engineId.trim(),
      engineLabel: this.draft.engineLabel.trim() || undefined,
      chantierId: this.draft.chantierId.trim(),
      chantierRef: this.draft.chantierLabel.trim() || undefined,
      date: new Date().toISOString().slice(0, 10),
      heuresFonctionnement: this.draft.heures,
    };
    this.gmao.addPointage(row);
    this.rows.set([row, ...this.rows()]);
  }
}
