import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { ExportButtonComponent, type ExportEvent } from '@lib/anatomy/components/molecules/export-button/export-button.component';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import {
  MARCHE_STATUS_KEYS,
  MARCHE_TYPE_KEYS,
  MARCHE_NATURE_KEYS,
} from '@applications/erp/shell/i18n-labels';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { ContratMarcheApiService } from '../services/contrat-marche-api.service';
import {
  MARCHE_STATUS_VARIANT,
  type MarcheStatus,
  type Marche,
} from '../../models';

@Component({
  selector: 'app-contrat-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, ButtonComponent, MadCurrencyPipe, ExportButtonComponent, FilterResetComponent, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: 'marches.contrat.listing.title' | translate,
        subtitle: 'marches.contrat.listing.subtitle' | translate,
        breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.contrat.listing.breadcrumb' | translate) }]
      }"></nf-page-header>

      <div class="toolbar">
        <input class="search" type="search" [attr.placeholder]="'marches.contrat.listing.search.placeholder' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'marches.common.filters.allStatuses' | translate }}</option>
          @for (s of statusOptions; track s) {
            <option [value]="s">{{ MARCHE_STATUS_KEYS[s] | translate }}</option>
          }
        </select>
        <span class="count">{{ 'marches.contrat.listing.count' | translate:{ count: filtered().length } }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-export-button [data]="filtered()" [columns]="exportColumns" [filename]="'marches.contrat.listing.exportFilename' | translate" (exported)="onExported($event)"></nf-export-button>
        <nf-button variant="primary" iconLibrary="lucide" icon="plus" (clicked)="onCreate()">
          {{ 'marches.contrat.listing.createCta' | translate }}
        </nf-button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'marches.contrat.listing.columns.numero' | translate }}</th>
              <th>{{ 'marches.contrat.listing.columns.chantier' | translate }}</th>
              <th>{{ 'marches.contrat.listing.columns.clientMoa' | translate }}</th>
              <th>{{ 'marches.contrat.listing.columns.type' | translate }}</th>
              <th>{{ 'marches.contrat.listing.columns.nature' | translate }}</th>
              <th class="num">{{ 'marches.contrat.listing.columns.montantInitialHt' | translate }}</th>
              <th class="num">{{ 'marches.contrat.listing.columns.totalAvenants' | translate }}</th>
              <th class="center">{{ 'marches.contrat.listing.columns.avancement' | translate }}</th>
              <th>{{ 'marches.contrat.listing.columns.os' | translate }}</th>
              <th>{{ 'marches.contrat.listing.columns.statut' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (m of filtered(); track m.id) {
              <tr [routerLink]="['/marches/contrats', m.id]" class="clickable">
                <td><strong class="code">{{ m.numero }}</strong></td>
                <td>
                  <a [routerLink]="['/chantiers', m.chantierId]" (click)="$event.stopPropagation()" class="chantier-link">
                    {{ m.chantierCode }}
                  </a>
                </td>
                <td>{{ m.clientNom }}</td>
                <td class="type">{{ MARCHE_TYPE_KEYS[m.type] | translate }}</td>
                <td>
                  <span class="nature" [class.nature--public]="m.nature === 'PUBLIC'">
                    {{ MARCHE_NATURE_KEYS[m.nature] | translate }}
                  </span>
                </td>
                <td class="num">{{ m.montantInitialHt | mad }}</td>
                <td class="num">{{ m.montantTotalHt | mad }}</td>
                <td class="center">
                  <div class="progress-wrap">
                    <div class="progress-bar"><div class="progress-fill" [style.width.%]="m.avancementPercent"></div></div>
                    <span>{{ m.avancementPercent }}%</span>
                  </div>
                </td>
                <td class="date">{{ m.dateOrdreService | date:'dd/MM/yy' }}</td>
                <td><span class="badge badge--{{ statusVariant(m.status) }}">{{ MARCHE_STATUS_KEYS[m.status] | translate }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="10" class="empty">{{ 'marches.contrat.listing.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 320px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); cursor: pointer; }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 300px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    th.center { text-align: center; }
    td { padding: 9px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.center { text-align: center; }
    td.type { white-space: nowrap; font-size: 12px; }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    .code { color: var(--nf-color-primary-700); }
    .chantier-link { color: var(--nf-color-primary-600); font-weight: 600; text-decoration: none; }
    .chantier-link:hover { text-decoration: underline; }
    .clickable { cursor: pointer; transition: background 80ms; }
    .clickable:hover { background: var(--nf-color-bg-subtle); }
    .nature { font-size: 11px; color: var(--nf-color-text-secondary); }
    .nature--public { color: var(--nf-color-danger-600); font-weight: 600; }
    .progress-wrap { display: flex; align-items: center; gap: 5px; justify-content: center; font-size: 11px; color: var(--nf-color-text-secondary); }
    .progress-bar { width: 48px; height: 5px; background: var(--nf-color-border); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--nf-color-primary-500); border-radius: 3px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class ContratListingPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(ContratMarcheApiService);
  private readonly toast = inject(ToastService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);

  readonly MARCHE_STATUS_KEYS = MARCHE_STATUS_KEYS;
  readonly MARCHE_TYPE_KEYS = MARCHE_TYPE_KEYS;
  readonly MARCHE_NATURE_KEYS = MARCHE_NATURE_KEYS;

  readonly marches = signal<Marche[]>([]);

  ngOnInit(): void {
    void this.loadMarches();
  }

  private async loadMarches(): Promise<void> {
    try {
      const res = await this.api.getAll();
      this.marches.set(res.items);
    } catch {
      this.marches.set([]);
      this.toast.error('Impossible de charger les contrats de marché.');
    }
  }

  readonly exportColumns = [
    { header: this.translate.instant('marches.contrat.listing.columns.numero'),     field: (m: Marche) => m.numero },
    { header: this.translate.instant('marches.contrat.listing.columns.chantier'),   field: (m: Marche) => m.chantierCode },
    { header: this.translate.instant('marches.contrat.listing.columns.client'),     field: (m: Marche) => m.clientNom },
    { header: this.translate.instant('marches.contrat.listing.columns.type'),       field: (m: Marche) => m.type },
    { header: this.translate.instant('marches.contrat.listing.columns.nature'),     field: (m: Marche) => m.nature },
    { header: this.translate.instant('marches.contrat.listing.columns.montantInitialHt'), field: (m: Marche) => m.montantInitialHt, type: 'currency' as const },
    { header: this.translate.instant('marches.contrat.listing.columns.totalHt'),    field: (m: Marche) => m.montantTotalHt, type: 'currency' as const },
    { header: this.translate.instant('marches.contrat.listing.columns.avancementPercent'), field: (m: Marche) => m.avancementPercent, type: 'percent' as const },
    { header: this.translate.instant('marches.contrat.listing.columns.statut'),     field: (m: Marche) => m.status },
    { header: this.translate.instant('marches.contrat.listing.columns.dateOs'),     field: (m: Marche) => m.dateOrdreService ?? '', type: 'date' as const },
  ];

  readonly search = signal('');
  readonly filterStatus = signal<MarcheStatus | ''>('');

  readonly statusOptions = Object.keys(MARCHE_STATUS_KEYS) as MarcheStatus[];

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const st = this.filterStatus();
    let all = this.marches();
    if (st) all = all.filter(m => m.status === st);
    if (!q) return all;
    return all.filter(m =>
      m.numero.toLowerCase().includes(q) ||
      m.intitule.toLowerCase().includes(q) ||
      m.chantierCode.toLowerCase().includes(q) ||
      m.clientNom.toLowerCase().includes(q),
    );
  });

  readonly hasFilter = computed(() => !!this.search() || !!this.filterStatus());

  resetFilters(): void {
    this.search.set('');
    this.filterStatus.set('');
  }

  onCreate(): void {
    void this.router.navigate(['/marches/contrats/new']);
  }

  statusVariant(s: MarcheStatus): string { return MARCHE_STATUS_VARIANT[s] ?? 'secondary'; }

  onExported(e: ExportEvent): void {
    const action = e.format === 'print' ? 'PRINT' : 'EXPORT';
    this.audit.log(
      action,
      'MARCHE',
      'listing',
      e.filename,
      // @i18n-exempt — internal audit log entry, not user-facing UI.
      `${e.format.toUpperCase()} — ${e.rowCount} ligne${e.rowCount > 1 ? 's' : ''}`,
    );
  }
}
