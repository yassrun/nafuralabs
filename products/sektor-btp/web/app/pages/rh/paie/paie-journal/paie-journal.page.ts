import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { FichePaie } from '@applications/erp/rh/models';
import { PaieApiService } from '../services/paie-api.service';

@Component({
  selector: 'app-paie-journal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, RouterLink],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="toolbar">
        <label>{{ 'rh.paie.journal.monthLabel' | translate }}
          <select [value]="mois()" (change)="onMois($event)">
            @for (m of moisOptions(); track m) {
              <option [value]="m">{{ m }}</option>
            }
          </select>
        </label>
        <a routerLink="/rh/paie" class="link-back">{{ 'rh.paie.journal.linkBack' | translate }}</a>
      </div>

      <div class="kpis">
        <div class="kpi"><span>{{ 'rh.paie.journal.kpi.brutTotal' | translate }}</span><strong>{{ totaux().brut | mad:2 }}</strong></div>
        <div class="kpi"><span>{{ 'rh.paie.journal.kpi.cnss' | translate }}</span><strong>{{ totaux().cnss | mad:2 }}</strong></div>
        <div class="kpi"><span>{{ 'rh.paie.journal.kpi.amo' | translate }}</span><strong>{{ totaux().amo | mad:2 }}</strong></div>
        <div class="kpi"><span>{{ 'rh.paie.journal.kpi.igr' | translate }}</span><strong>{{ totaux().igr | mad:2 }}</strong></div>
        <div class="kpi kpi--accent"><span>{{ 'rh.paie.journal.kpi.net' | translate }}</span><strong>{{ totaux().net | mad:2 }}</strong></div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'rh.paie.journal.columns.numero' | translate }}</th>
            <th>{{ 'rh.paie.journal.columns.employe' | translate }}</th>
            <th>{{ 'rh.paie.journal.columns.statut' | translate }}</th>
            <th class="num">{{ 'rh.paie.journal.columns.brut' | translate }}</th>
            <th class="num">{{ 'rh.paie.journal.columns.cnss' | translate }}</th>
            <th class="num">{{ 'rh.paie.journal.columns.amo' | translate }}</th>
            <th class="num">{{ 'rh.paie.journal.columns.igr' | translate }}</th>
            <th class="num">{{ 'rh.paie.journal.columns.net' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (p of fichesMois(); track p.id) {
              <tr>
                <td class="ref"><a [routerLink]="['/rh/paie', p.id]">{{ p.numero }}</a></td>
                <td>{{ p.employeNom ?? '—' }}</td>
                <td>{{ ('rh.paie.statuses.' + p.status) | translate }}</td>
                <td class="num">{{ p.salaireBrut | mad:2 }}</td>
                <td class="num">{{ p.cotisationCNSS | mad:2 }}</td>
                <td class="num">{{ p.cotisationAMO | mad:2 }}</td>
                <td class="num">{{ p.igr | mad:2 }}</td>
                <td class="num">{{ p.salaireNetAPayer | mad:2 }}</td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="empty">{{ 'rh.paie.journal.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .toolbar label { font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .toolbar select { padding: 6px 10px; border-radius: 6px; border: 1px solid var(--nf-color-border); }
    .link-back { font-size: 13px; color: var(--nf-color-primary-700); text-decoration: none; font-weight: 600; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 1rem; }
    .kpi { background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
    .kpi span { font-size: 11px; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
    .kpi strong { font-size: 1rem; color: var(--nf-color-text-primary); }
    .kpi--accent { background: var(--nf-color-primary-50); border-color: var(--nf-color-primary-200); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 9px 10px; background: var(--nf-color-bg-subtle); border-bottom: 2px solid var(--nf-color-border); color: var(--nf-color-text-secondary); }
    th.num { text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.ref a { color: var(--nf-color-primary-700); font-family: monospace; font-size: 11px; text-decoration: none; font-weight: 600; }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class PaieJournalPage {
  private readonly paieApi = inject(PaieApiService);
  private readonly translate = inject(TranslateService);

  readonly mois = signal('2026-04');
  readonly paieRows = signal<FichePaie[]>([]);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('rh.paie.journal.title'),
    subtitle: this.translate.instant('rh.paie.journal.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('rh.common.module'), route: '/rh' },
      { label: this.translate.instant('rh.routes.paie.title'), route: '/rh/paie' },
      { label: this.translate.instant('rh.routes.paieJournal.breadcrumb') },
    ],
  }));

  constructor() {
    void this.refresh();
  }

  readonly moisOptions = computed(() => {
    const set = new Set(this.paieRows().map((p) => p.mois));
    const fromData = [...set].sort().reverse();
    return fromData.length ? fromData : ['2026-04', '2026-05'];
  });

  readonly fichesMois = computed(() =>
    this.paieRows().filter((p) => p.mois === this.mois()).sort((a, b) => a.numero.localeCompare(b.numero)),
  );

  readonly totaux = computed(() => {
    const rows = this.fichesMois();
    const sum = (f: keyof FichePaie) => rows.reduce((s, p) => s + (Number(p[f]) || 0), 0);
    return {
      brut: sum('salaireBrut'),
      cnss: sum('cotisationCNSS'),
      amo: sum('cotisationAMO'),
      igr: sum('igr'),
      net: sum('salaireNetAPayer'),
    };
  });

  async refresh(): Promise<void> {
    const { items: rows } = await this.paieApi.getAll({ page: 1, pageSize: 500 });
    this.paieRows.set(rows);
    if (!rows.some((p) => p.mois === this.mois())) {
      const latest = [...new Set(rows.map((r) => r.mois))].sort().reverse()[0];
      if (latest) this.mois.set(latest);
    }
  }

  onMois(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.mois.set(v);
  }
}
