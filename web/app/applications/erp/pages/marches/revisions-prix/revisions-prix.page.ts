import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { FormuleRevisionKService } from '../services/formule-revision-k.service';
import { RevisionPrixApiService } from './services/revision-prix-api.service';
import { ContratMarcheApiService } from '../contrats/services/contrat-marche-api.service';
import type { FormuleRevisionK, Marche } from '../models';

interface IndiceBT {
  code: string;
  libelle: string;
  mois: string;
  valeur: number;
}

@Component({
  selector: 'app-revisions-prix',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageShellComponent, PageHeaderComponent, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: 'marches.revisionsPrix.title' | translate,
        subtitle: 'marches.revisionsPrix.subtitle' | translate,
        breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.revisionsPrix.breadcrumb' | translate) }]
      }"></nf-page-header>

      <section class="section">
        <h2 class="section-title">{{ 'marches.revisionsPrix.indices.title' | translate }}</h2>
        <div class="indices-grid">
          @for (code of indicesCodes; track code) {
            <div class="indice-card">
              <h3>{{ code }}</h3>
              <p class="indice-label">{{ indiceLabel(code) }}</p>
              <table class="mini-table">
                <thead><tr>
                  <th>{{ 'marches.revisionsPrix.indices.columns.mois' | translate }}</th>
                  <th class="num">{{ 'marches.revisionsPrix.indices.columns.valeur' | translate }}</th>
                  <th class="num">{{ 'marches.revisionsPrix.indices.columns.deltaPercent' | translate }}</th>
                </tr></thead>
                <tbody>
                  @for (row of indicesByCode(code); track row.mois) {
                    <tr>
                      <td>{{ row.mois }}</td>
                      <td class="num">{{ row.valeur }}</td>
                      <td class="num" [class.positive]="row.delta > 0" [class.negative]="row.delta < 0">
                        {{ row.delta > 0 ? '+' : '' }}{{ row.delta | number:'1.2-2' }}%
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">{{ 'marches.revisionsPrix.coefK.title' | translate }}</h2>
        <div class="toolbar">
          <label>{{ 'marches.revisionsPrix.coefK.labelMois' | translate }}
            <select [value]="moisCalcul()" (change)="moisCalcul.set($any($event.target).value)">
              @for (m of moisDisponibles(); track m) { <option [value]="m">{{ m }}</option> }
            </select>
          </label>
        </div>

        <table class="data-table">
          <thead><tr>
            <th>{{ 'marches.revisionsPrix.coefK.columns.marche' | translate }}</th>
            <th>{{ 'marches.revisionsPrix.coefK.columns.type' | translate }}</th>
            <th>{{ 'marches.revisionsPrix.coefK.columns.termeFixe' | translate }}</th>
            @for (code of indicesCodes; track code) { <th class="num">{{ code }}</th> }
            <th class="num kval">{{ 'marches.revisionsPrix.coefK.columns.kCalcule' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (row of marcheKRows(); track row.marcheId) {
              <tr [class.row--na]="row.kNaN">
                <td><strong class="code">{{ row.marcheNumero }}</strong></td>
                <td class="type">{{ 'marches.revisionsPrix.coefK.typeFormulaSummary' | translate:{ fixe: row.termeFixe, n: row.termesCount } }}</td>
                <td class="num">{{ row.termeFixe }}</td>
                @for (code of indicesCodes; track code) {
                  <td class="num">{{ row.indices[code] ?? '—' }}</td>
                }
                <td class="num kval">
                  @if (!row.kNaN) {
                    <strong [class.k-up]="row.k > 1" [class.k-down]="row.k < 1">{{ row.k | number:'1.4-4' }}</strong>
                  } @else {
                    <span class="na">{{ 'marches.revisionsPrix.coefK.indiceMissing' | translate }}</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td [attr.colspan]="3 + indicesCodes.length + 1" class="empty">{{ 'marches.revisionsPrix.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>

        @if (marcheKRows().length > 0) {
          <p class="formula-note" [innerHTML]="'marches.revisionsPrix.formula' | translate"></p>
        }
      </section>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .section { margin-bottom: 2rem; }
    .section-title { font-size: 0.82rem; font-weight: 700; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 1rem; }
    .toolbar { margin-bottom: 0.875rem; font-size: 13px; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
    .toolbar label { display: flex; align-items: center; gap: 8px; }
    .toolbar select { padding: 6px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }

    .indices-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .indice-card { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1rem 1.1rem; }
    .indice-card h3 { margin: 0 0 0.2rem; font-size: 1rem; font-weight: 700; color: var(--nf-color-primary-700); font-family: monospace; }
    .indice-label { margin: 0 0 0.75rem; font-size: 0.8rem; color: var(--nf-color-text-secondary); }
    .mini-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .mini-table th { padding: 4px 6px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 1px solid var(--nf-color-border); }
    .mini-table th.num { text-align: right; }
    .mini-table td { padding: 4px 6px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    .mini-table td.num { text-align: right; font-variant-numeric: tabular-nums; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; overflow: hidden; }
    .data-table th { padding: 9px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; }
    .data-table th.num { text-align: right; }
    .data-table th.kval { background: var(--nf-color-primary-50); color: var(--nf-color-primary-700); }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    .data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table td.kval { text-align: right; }
    .data-table td.type { font-size: 12px; color: var(--nf-color-text-secondary); }
    .code { color: var(--nf-color-primary-700); }
    .k-up { color: var(--nf-color-danger-600); }
    .k-down { color: var(--nf-color-success-600); }
    .na { color: var(--nf-color-text-muted); font-size: 11px; }
    .row--na { background: var(--nf-color-bg-subtle); }
    .positive { color: var(--nf-color-danger-600); }
    .negative { color: var(--nf-color-success-600); }

    .formula-note { font-size: 12px; color: var(--nf-color-text-secondary); margin-top: 0.75rem; }
    .formula-note ::ng-deep code { background: var(--nf-color-bg-muted); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: var(--nf-color-primary-700); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class RevisionsPrixPage implements OnInit {
  private readonly api = inject(RevisionPrixApiService);
  private readonly contratApi = inject(ContratMarcheApiService);
  private readonly formuleK = inject(FormuleRevisionKService);
  private readonly toast = inject(ToastService);

  readonly indicesCodes = ['BTP01', 'BTP18', 'MO'] as const;
  readonly indices = signal<IndiceBT[]>([]);
  readonly marches = signal<Marche[]>([]);
  readonly moisCalcul = signal('2026-04');

  readonly moisDisponibles = computed(() => {
    const months = [...new Set(this.indices().map(i => i.mois))].sort();
    return months.length > 0 ? months : ['2026-01', '2026-02', '2026-03', '2026-04'];
  });

  ngOnInit(): void {
    void Promise.all([this.loadIndicesFromApi(), this.loadMarches()]);
  }

  private async loadMarches(): Promise<void> {
    try {
      const res = await this.contratApi.getAll();
      this.marches.set(res.items);
    } catch {
      this.marches.set([]);
      this.toast.error('Impossible de charger les contrats pour les révisions de prix.');
    }
  }

  private async loadIndicesFromApi(): Promise<void> {
    const periods = ['2026-01', '2026-02', '2026-03', '2026-04'];
    try {
      const batches = await Promise.all(periods.map(p => this.api.listIndices(p)));
      const merged: IndiceBT[] = [];
      for (const batch of batches) {
        for (const row of batch) {
          merged.push({ code: row.code, libelle: row.libelle, mois: row.mois, valeur: row.valeur });
        }
      }
      this.indices.set(merged);
    } catch {
      this.indices.set([]);
      this.toast.error('Impossible de charger les indices BTP.');
    }
  }

  indiceLabel(code: string): string {
    return this.indices().find(i => i.code === code)?.libelle ?? code;
  }

  indicesByCode(code: string): Array<{ mois: string; valeur: number; delta: number }> {
    const rows = this.indices().filter(i => i.code === code).sort((a, b) => a.mois.localeCompare(b.mois));
    return rows.map((r, i) => ({
      mois: r.mois,
      valeur: r.valeur,
      delta: i === 0 ? 0 : Math.round((r.valeur - rows[i - 1].valeur) / rows[i - 1].valeur * 10000) / 100,
    }));
  }

  readonly marcheKRows = computed(() => {
    const mois = this.moisCalcul();
    const indicesMap = new Map<string, number>();
    this.indices().filter(i => i.mois === mois).forEach(i => indicesMap.set(i.code, i.valeur));

    return this.marches()
      .filter(m => !!m.formuleRevisionK)
      .map(m => {
        const fk = m.formuleRevisionK as FormuleRevisionK;
        const k = this.formuleK.calculerK(fk, indicesMap);
        const indicesRow: Record<string, number | undefined> = {};
        fk.termesVariables.forEach(t => { indicesRow[t.indiceCode] = indicesMap.get(t.indiceCode); });
        return {
          marcheId: m.id,
          marcheNumero: m.numero,
          termesCount: fk.termesVariables.length,
          termeFixe: fk.termeFixe,
          indices: indicesRow,
          k: isNaN(k) ? 1 : k,
          kNaN: isNaN(k),
        };
      });
  });
}
