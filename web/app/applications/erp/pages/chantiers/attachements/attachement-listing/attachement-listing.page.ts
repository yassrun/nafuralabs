import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { AttachementApiService } from '../attachement-api.service';
import { ATTACHEMENT_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import {
  type Attachement,
  type AttachementStatus,
  type MeteoCode,
} from '../attachement.models';

const METEO_EMOJI: Record<MeteoCode, string> = {
  SOLEIL: '☀️', NUAGEUX: '⛅', PLUIE: '🌧', VENT: '💨',
};

const STATUS_CSS: Record<string, string> = {
  BROUILLON: 'badge--secondary',
  EN_ATTENTE_MOE: 'badge--warning',
  SIGNE_MOE: 'badge--info',
  EN_ATTENTE_MOA: 'badge--warning',
  CONTRESIGNE_MOA: 'badge--success',
  CONTESTE: 'badge--danger',
};

@Component({
  selector: 'app-attachement-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, FilterResetComponent, ButtonComponent, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="pageHeaderConfig"></nf-page-header>

      <div class="toolbar">
        <input class="search" type="search"
          [placeholder]="'chantiers.attachement.list.searchPlaceholder' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'chantiers.attachement.list.allStatuses' | translate }}</option>
          @for (s of statusEntries(); track s[0]) { <option [value]="s[0]">{{ s[1] }}</option> }
        </select>
        <span class="count">{{ filtered().length <= 1 ? filtered().length + ' attachement' : filtered().length + ' attachements' }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-button variant="primary" icon="plus" iconLibrary="lucide" (clicked)="goToSaisie()">{{ 'chantiers.attachement.list.saisieCta' | translate }}</nf-button>
      </div>

      <div class="att-list">
        @for (a of filtered(); track a.id) {
          <article class="att-card">
            <div class="att-header">
              <div class="att-meta">
                <strong class="att-num">{{ a.numero }}</strong>
                <span class="sep">·</span>
                <span class="chantier-code">{{ a.chantierCode }}</span>
                <span class="sep">·</span>
                <span class="date">{{ a.date | date:'dd/MM/yyyy' }}</span>
                @if (a.meteoCode) { <span class="meteo">{{ meteoEmoji(a.meteoCode) }} {{ a.temperatureC }}°C</span> }
              </div>
              <div class="att-right">
                <span class="eff">👷 {{ a.effectifPresent }} ouvriers</span>
                @if (a.signatureMoeDataUrl) {
                  <span class="sig">{{ 'chantiers.attachement.list.signedShort' | translate }}</span>
                }
                <span class="badge {{ statusCss(a.status) }}">{{ statusLabel(a.status) }}</span>
              </div>
            </div>

            <table class="lignes-table">
              <thead><tr>
                <th>Poste</th>
                <th>{{ 'chantiers.attachement.list.columns.designation' | translate }}</th>
                <th class="num">{{ 'chantiers.attachement.list.columns.qteExecutee' | translate }}</th>
                <th>{{ 'chantiers.attachement.list.columns.unite' | translate }}</th>
                <th>Zone</th>
              </tr></thead>
              <tbody>
                @for (l of a.lignes; track l.posteCode) {
                  <tr>
                    <td class="code">{{ l.posteCode }}</td>
                    <td>{{ l.designation }}</td>
                    <td class="num">{{ l.quantiteExecutee }}</td>
                    <td>{{ l.unite }}</td>
                    <td class="zone">{{ l.zone ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </article>
        } @empty {
          <div class="empty">{{ 'chantiers.attachement.list.emptyState' | translate }}</div>
        }
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .sig { font-size: 11px; font-weight: 600; color: var(--nf-color-primary-700); }
    .att-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .att-card { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1rem 1.25rem; }
    .att-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.875rem; flex-wrap: wrap; }
    .att-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.87rem; }
    .att-num { color: var(--nf-color-primary-700); font-size: 0.8rem; }
    .sep { color: var(--nf-color-border); }
    .chantier-code { font-weight: 700; color: var(--nf-color-primary-600); }
    .date { color: var(--nf-color-text-secondary); }
    .meteo { font-size: 0.8rem; }
    .att-right { display: flex; align-items: center; gap: 0.5rem; }
    .eff { font-size: 12px; color: var(--nf-color-text-secondary); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-50, #dcfce7); color: var(--nf-color-success-700); }
    .badge--danger { background: var(--nf-color-danger-50); color: var(--nf-color-danger-700); }
    .badge--warning { background: var(--nf-color-warning-50); color: var(--nf-color-warning-700); }
    .lignes-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .lignes-table th { padding: 6px 10px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 1px solid var(--nf-color-border); }
    .lignes-table th.num { text-align: right; }
    .lignes-table td { padding: 5px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    .lignes-table td.num { text-align: right; }
    .lignes-table td.code { font-family: monospace; font-size: 11px; color: var(--nf-color-text-secondary); }
    .lignes-table td.zone { font-size: 11px; color: var(--nf-color-text-muted); }
    .empty { text-align: center; padding: 2.5rem; color: var(--nf-color-text-muted); }
  `],
})
export class AttachementListingPage implements OnInit {
  private readonly api = inject(AttachementApiService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly items = signal<Attachement[]>([]);

  readonly pageHeaderConfig = {
    title: "Carnets d'attachement",
    subtitle: 'Journal quotidien des travaux exécutés (base facturation BPU)',
    breadcrumbs: [
      { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
      { label: this.translate.instant('chantiers.routes.attachementsCrumb') },
    ],
  };

  readonly search = signal('');
  readonly filterStatus = signal<AttachementStatus | ''>('');

  readonly statusEntries = computed<[AttachementStatus, string][]>(() => {
    return (Object.keys(ATTACHEMENT_STATUS_KEYS) as AttachementStatus[]).map((status) => {
      const key = ATTACHEMENT_STATUS_KEYS[status];
      const resolved = this.translate.instant(key);
      return [status, resolved === key ? String(status) : resolved];
    });
  });

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.items.set(await this.api.listAll());
    } catch {
      this.items.set([]);
    }
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const st = this.filterStatus();
    let list: Attachement[] = this.items();
    if (st) list = list.filter(a => a.status === st);
    if (!q) return list;
    return list.filter(a =>
      a.chantierCode.toLowerCase().includes(q) ||
      a.date.includes(q) ||
      a.numero.toLowerCase().includes(q),
    );
  });

  meteoEmoji(m: MeteoCode): string { return METEO_EMOJI[m]; }
  statusLabel(s: AttachementStatus): string {
    const key = ATTACHEMENT_STATUS_KEYS[s];
    if (!key) return s;
    const resolved = this.translate.instant(key);
    return resolved === key ? s : resolved;
  }
  statusCss(s: AttachementStatus): string { return STATUS_CSS[s] ?? 'badge--secondary'; }
  readonly hasFilter = computed(() => !!this.search() || !!this.filterStatus());

  resetFilters(): void {
    this.search.set('');
    this.filterStatus.set('');
  }

  goToSaisie(): void {
    void this.router.navigate(['/chantiers/attachements/saisie']);
  }

}
