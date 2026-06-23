import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { ExportService, type ExportColumn } from '@lib/anatomy/services/export.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import type { RegistreLegalEntry, RegistreLegalKind } from '../models';
import { RegistreLegalApiService } from './services/registre-legal-api.service';

interface TabDef {
  kind: RegistreLegalKind;
  labelKey: string;
  shortLabelKey: string;
  icon: string;
  descriptionKey: string;
}

const TABS: TabDef[] = [
  { kind: 'AT',  labelKey: 'hse.registreLegal.tabs.at.label',  shortLabelKey: 'hse.registreLegal.tabs.at.shortLabel',  icon: '🚑', descriptionKey: 'hse.registreLegal.tabs.at.description' },
  { kind: 'MP',  labelKey: 'hse.registreLegal.tabs.mp.label',  shortLabelKey: 'hse.registreLegal.tabs.mp.shortLabel',  icon: '🩺', descriptionKey: 'hse.registreLegal.tabs.mp.description' },
  { kind: 'DT',  labelKey: 'hse.registreLegal.tabs.dt.label',  shortLabelKey: 'hse.registreLegal.tabs.dt.shortLabel',  icon: '📄', descriptionKey: 'hse.registreLegal.tabs.dt.description' },
  { kind: 'CHS', labelKey: 'hse.registreLegal.tabs.chs.label', shortLabelKey: 'hse.registreLegal.tabs.chs.shortLabel', icon: '🤝', descriptionKey: 'hse.registreLegal.tabs.chs.description' },
];

const COMPANY = {
  nom: 'SOMACOM BTP SARL',
  ice: '002345678901234',
  cnss: '1234567',
  ville: 'Casablanca',
};

@Component({
  selector: 'app-registres-legaux',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: ('hse.registreLegal.headerTitle' | translate),
        subtitle: ('hse.registreLegal.subtitle' | translate),
        breadcrumbs: [
          { label: ('hse.common.breadcrumb' | translate), route: '/hse/tableau-bord' },
          { label: ('hse.routes.registresLegaux.breadcrumb' | translate) }
        ]
      }"></nf-page-header>

      <!-- Tabs -->
      <div class="tabs no-print">
        @for (t of tabs; track t.kind) {
          <nf-button variant="ghost" size="sm" [active]="activeTab() === t.kind" (clicked)="activeTab.set(t.kind)">
            <span class="tab-icon">{{ t.icon }}</span>
            <span class="tab-label">{{ t.shortLabelKey | translate }}</span>
            <span class="tab-count">{{ countByKind(t.kind) }}</span>
          </nf-button>
        }
      </div>

      <!-- Active tab body -->
      <div class="registre print-area">
        <!-- Print-only header -->
        <div class="print-header print-only">
          <h1>{{ 'hse.registreLegal.printHeader.registre' | translate: { label: (currentTab().labelKey | translate) } }}</h1>
          <div class="print-meta">
            <div><strong>{{ 'hse.registreLegal.printHeader.societe' | translate }}</strong> {{ company.nom }}</div>
            <div><strong>{{ 'hse.registreLegal.printHeader.ice' | translate }}</strong> {{ company.ice }}</div>
            <div><strong>{{ 'hse.registreLegal.printHeader.cnss' | translate }}</strong> {{ company.cnss }}</div>
            <div><strong>{{ 'hse.registreLegal.printHeader.editeLe' | translate }}</strong> {{ today | date:'dd/MM/yyyy' }}</div>
          </div>
        </div>

        <div class="registre-header">
          <div class="registre-title">
            <span class="registre-icon">{{ currentTab().icon }}</span>
            <div>
              <h2>{{ currentTab().labelKey | translate }}</h2>
              <p class="registre-desc">{{ currentTab().descriptionKey | translate }}</p>
            </div>
          </div>
          <div class="registre-actions no-print">
            <nf-button variant="ghost" (clicked)="printPage()" [title]="'hse.registreLegal.actions.imprimerTitle' | translate">
              🖨️ {{ 'hse.registreLegal.actions.imprimer' | translate }}
            </nf-button>
            <nf-button variant="primary" (clicked)="exportXlsx()" [title]="'hse.registreLegal.actions.excelTitle' | translate">
              📊 {{ 'hse.registreLegal.actions.excel' | translate }}
            </nf-button>
            <nf-button variant="secondary" (clicked)="openPdfOfficiel()" [title]="'hse.registreLegal.actions.pdfOfficielTitle' | translate">
              📋 {{ 'hse.registreLegal.actions.pdfOfficiel' | translate }}
            </nf-button>
          </div>
        </div>

        @if (currentEntries().length > 0) {
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>{{ 'hse.registreLegal.columns.numero' | translate }}</th>
                <th>{{ 'hse.registreLegal.columns.date' | translate }}</th>
                <th>{{ 'hse.registreLegal.columns.reference' | translate }}</th>

                @switch (activeTab()) {
                  @case ('AT') {
                    <th>{{ 'hse.registreLegal.columns.chantier' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.victime' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.matriculeCnss' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.description' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.partieAtteinte' | translate }}</th>
                    <th class="num">{{ 'hse.registreLegal.columns.joursArret' | translate }}</th>
                  }
                  @case ('MP') {
                    <th>{{ 'hse.registreLegal.columns.salarie' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.matriculeCnss' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.tableauMa' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.description' | translate }}</th>
                  }
                  @case ('DT') {
                    <th>{{ 'hse.registreLegal.columns.chantier' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.description' | translate }}</th>
                    <th class="num">{{ 'hse.registreLegal.columns.effectif' | translate }}</th>
                    <th class="num">{{ 'hse.registreLegal.columns.duree' | translate }}</th>
                  }
                  @case ('CHS') {
                    <th>{{ 'hse.registreLegal.columns.description' | translate }}</th>
                    <th class="num">{{ 'hse.registreLegal.columns.presents' | translate }}</th>
                    <th>{{ 'hse.registreLegal.columns.decisions' | translate }}</th>
                  }
                }

                <th>{{ 'hse.registreLegal.columns.observations' | translate }}</th>
              </tr></thead>
              <tbody>
                @for (e of currentEntries(); track e.id) {
                  <tr>
                    <td class="ref">{{ e.numero }}</td>
                    <td class="date">{{ e.date | date:'dd/MM/yyyy' }}</td>
                    <td class="ref">{{ e.reference ?? '—' }}</td>

                    @switch (activeTab()) {
                      @case ('AT') {
                        <td class="chantier-code">{{ e.chantierCode ?? '—' }}</td>
                        <td>{{ e.employeNom ?? '—' }}</td>
                        <td class="ref">{{ e.cnssMatricule ?? '—' }}</td>
                        <td>{{ e.description }}</td>
                        <td>{{ e.partieDuCorps ?? '—' }}</td>
                        <td class="num">{{ e.joursArret ?? 0 }}</td>
                      }
                      @case ('MP') {
                        <td>{{ e.employeNom ?? '—' }}</td>
                        <td class="ref">{{ e.cnssMatricule ?? '—' }}</td>
                        <td>{{ e.tableauMP ?? '—' }}</td>
                        <td>{{ e.description }}</td>
                      }
                      @case ('DT') {
                        <td class="chantier-code">{{ e.chantierCode ?? '—' }}</td>
                        <td>{{ e.description }}</td>
                        <td class="num">{{ e.effectif ?? 0 }}</td>
                        <td class="num">{{ e.dureeJours ?? 0 }}</td>
                      }
                      @case ('CHS') {
                        <td>{{ e.description }}</td>
                        <td class="num">{{ e.presents ?? 0 }}</td>
                        <td class="decisions">{{ e.decisions ?? '—' }}</td>
                      }
                    }

                    <td class="observations">{{ e.observations ?? '—' }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td [attr.colspan]="footerColspan()" class="footer-text"
                    [innerHTML]="'hse.registreLegal.footer' | translate: { n: currentEntries().length }">
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        } @else {
          <div class="empty">{{ 'hse.registreLegal.empty' | translate: { kind: (currentTab().shortLabelKey | translate) } }}</div>
        }
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .tabs { display: flex; gap: 6px; margin-bottom: 1rem; flex-wrap: wrap; border-bottom: 2px solid var(--nf-color-border); padding-bottom: 4px; }
    .tab { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid var(--nf-color-border); border-bottom: none; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 80ms; }
    .tab:hover { background: var(--nf-color-bg-muted); }
    .tab--active { background: var(--nf-color-surface); color: var(--nf-color-text-primary); border-color: var(--nf-color-border); box-shadow: 0 -2px 0 var(--nf-color-primary-700) inset; }
    .tab-icon { font-size: 1rem; }
    .tab-count { display: inline-block; min-width: 20px; padding: 1px 6px; border-radius: 10px; background: var(--nf-color-border); font-size: 11px; color: var(--nf-color-text-secondary); text-align: center; }
    .tab--active .tab-count { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }

    .registre { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0 8px 8px 8px; padding: 1rem 1.25rem; }
    .registre-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .registre-title { display: flex; gap: 12px; align-items: center; }
    .registre-icon { font-size: 1.75rem; }
    .registre-title h2 { margin: 0; font-size: 1.05rem; color: var(--nf-color-text-primary); }
    .registre-desc { margin: 2px 0 0; font-size: 12.5px; color: var(--nf-color-text-secondary); }
    .registre-actions { display: flex; gap: 8px; }
    .btn-ghost, .btn-primary, .btn-secondary { padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-ghost { background: var(--nf-color-surface); color: var(--nf-color-text-secondary); border: 1px solid var(--nf-color-border); }
    .btn-ghost:hover { background: var(--nf-color-bg-subtle); }
    .btn-primary { background: var(--nf-color-primary-500); color: var(--nf-color-primary-contrast); border: none; }
    .btn-primary:hover { background: var(--nf-color-primary-600); }
    .btn-secondary { background: var(--nf-color-text-primary); color: var(--nf-color-primary-contrast); border: none; margin-left: 6px; }
    .btn-secondary:hover { background: var(--nf-color-text-primary); }

    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 380px); }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th { position: sticky; top: 0; padding: 9px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); vertical-align: top; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    td.ref { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-700); white-space: nowrap; }
    td.chantier-code { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-600); white-space: nowrap; }
    td.observations { font-size: 12px; max-width: 240px; color: var(--nf-color-text-secondary); }
    td.decisions { font-size: 12px; max-width: 280px; color: var(--nf-color-text-secondary); }
    tfoot td { border-top: 2px solid var(--nf-color-border); background: var(--nf-color-bg-subtle); padding: 10px 12px; font-size: 12px; }
    .footer-text { color: var(--nf-color-text-secondary); }

    .empty { text-align: center; padding: 3rem; color: var(--nf-color-text-muted); font-size: 0.9rem; }

    .print-only { display: none; }
    .print-header h1 { margin: 0 0 0.5rem; font-size: 1.3rem; }
    .print-meta { display: flex; gap: 1.25rem; flex-wrap: wrap; font-size: 12px; color: var(--nf-color-text-secondary); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--nf-color-border); }

    @media print {
      :host { background: var(--nf-color-surface); }
      .no-print { display: none !important; }
      .print-only { display: block; }
      .registre { border: none; padding: 0; box-shadow: none; }
      .registre-actions { display: none !important; }
      .table-wrap { max-height: none; overflow: visible; border: none; }
      th { background: var(--nf-color-bg-muted) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr { page-break-inside: avoid; }
    }
  `],
})
export class RegistresLegauxPage {
  private readonly api = inject(RegistreLegalApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly exportSvc = inject(ExportService);
  private readonly translate = inject(TranslateService);

  readonly tabs = TABS;
  readonly company = COMPANY;
  readonly today = new Date().toISOString();
  readonly activeTab = signal<RegistreLegalKind>('AT');
  readonly registres = signal<RegistreLegalEntry[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.loadRegistres();
  }

  async loadRegistres(): Promise<void> {
    this.loading.set(true);
    try {
      const { items } = await this.api.getAll();
      this.registres.set(items);
    } catch {
      this.registres.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  readonly currentTab = computed<TabDef>(() => {
    const k = this.activeTab();
    return TABS.find((t) => t.kind === k) ?? TABS[0];
  });

  readonly currentEntries = computed<RegistreLegalEntry[]>(() =>
    this.registres()
      .filter((e) => e.registre === this.activeTab())
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  countByKind(kind: RegistreLegalKind): number {
    return this.registres().filter((e) => e.registre === kind).length;
  }

  footerColspan(): number {
    switch (this.activeTab()) {
      case 'AT':  return 10;
      case 'MP':  return 8;
      case 'DT':  return 8;
      case 'CHS': return 7;
    }
  }

  printPage(): void {
    const kind = this.activeTab();
    this.audit.log(
      'PRINT',
      'REGISTRE_LEGAL',
      kind,
      this.translate.instant('hse.registreLegal.audit.labelRegistre', { kind }),
      this.translate.instant('hse.registreLegal.audit.printNote', { n: this.currentEntries().length }),
    );
    window.print();
  }

  exportXlsx(): void {
    const kind = this.activeTab();
    const entries = this.currentEntries();
    const cols = this.columnsFor(kind);
    const filename = `registre-${kind.toLowerCase()}`;
    this.exportSvc.exportXlsx(entries, {
      filename,
      sheetName: this.translate.instant('hse.registreLegal.audit.labelRegistre', { kind }),
      columns: cols,
    });
    this.audit.log(
      'EXPORT',
      'REGISTRE_LEGAL',
      kind,
      this.translate.instant('hse.registreLegal.audit.labelRegistre', { kind }),
      this.translate.instant('hse.registreLegal.audit.exportNote', { n: entries.length }),
    );
  }

  openPdfOfficiel(): void {
    const t = this.translate;
    const kind = this.activeTab();
    const rows = this.currentEntries()
      .map((e) => `<tr><td>${e.numero}</td><td>${e.date}</td><td>${e.reference ?? ''}</td><td>${escapeHtml(e.description)}</td></tr>`)
      .join('');
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>CNSS — Registre ${kind}</title>
    <style>
      body{font-family:Georgia,serif;padding:28px;color:var(--nf-color-text-primary);}
      .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--nf-color-text-primary);padding-bottom:12px;margin-bottom:16px;}
      .stamp{border:2px dashed var(--nf-color-text-primary);min-height:72px;width:200px;text-align:center;padding:8px;font-size:11px;color:var(--nf-color-text-secondary);}
      h1{margin:0;font-size:17px;} .meta{font-size:12px;margin-top:6px;}
      table{width:100%;border-collapse:collapse;font-size:11px;}
      th,td{border:1px solid var(--nf-color-text-primary);padding:5px 6px;}
      th{background:var(--nf-color-bg-muted);}
      .foot{margin-top:18px;font-size:10px;color:var(--nf-color-text-secondary);}
    </style></head><body>
    <div class="head">
      <div>
        <h1>${escapeHtml(t.instant('hse.registreLegal.print.titre', { kind }))}</h1>
        <div class="meta">${escapeHtml(t.instant('hse.registreLegal.print.meta', { societe: this.company.nom, ice: this.company.ice, cnss: this.company.cnss }))}</div>
      </div>
      <div class="stamp">${escapeHtml(t.instant('hse.registreLegal.print.stamp'))}</div>
    </div>
    <table><thead><tr>
      <th>${escapeHtml(t.instant('hse.registreLegal.columns.numero'))}</th>
      <th>${escapeHtml(t.instant('hse.registreLegal.columns.date'))}</th>
      <th>${escapeHtml(t.instant('hse.registreLegal.columns.reference'))}</th>
      <th>${escapeHtml(t.instant('hse.registreLegal.columns.description'))}</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <p class="foot">${escapeHtml(t.instant('hse.registreLegal.print.footnote'))}</p>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    this.audit.log(
      'PRINT',
      'REGISTRE_LEGAL',
      kind,
      t.instant('hse.registreLegal.audit.labelRegistre', { kind }),
      t.instant('hse.registreLegal.audit.pdfNote'),
    );
  }

  private columnsFor(kind: RegistreLegalKind): ExportColumn<RegistreLegalEntry>[] {
    const t = this.translate;
    const base: ExportColumn<RegistreLegalEntry>[] = [
      { header: t.instant('hse.registreLegal.columns.numero'),    field: (e) => e.numero },
      { header: t.instant('hse.registreLegal.columns.date'),      field: (e) => e.date, type: 'date' as const },
      { header: t.instant('hse.registreLegal.columns.reference'), field: (e) => e.reference ?? '' },
    ];
    const tail: ExportColumn<RegistreLegalEntry>[] = [
      { header: t.instant('hse.registreLegal.columns.observations'), field: (e) => e.observations ?? '' },
    ];
    switch (kind) {
      case 'AT':
        return [
          ...base,
          { header: t.instant('hse.registreLegal.columns.chantier'),       field: (e) => e.chantierCode ?? '' },
          { header: t.instant('hse.registreLegal.columns.victime'),        field: (e) => e.employeNom ?? '' },
          { header: t.instant('hse.registreLegal.columns.matriculeCnss'),  field: (e) => e.cnssMatricule ?? '' },
          { header: t.instant('hse.registreLegal.columns.description'),    field: (e) => e.description },
          { header: t.instant('hse.registreLegal.columns.partieAtteinte'), field: (e) => e.partieDuCorps ?? '' },
          { header: t.instant('hse.registreLegal.columns.joursArret'),     field: (e) => e.joursArret ?? 0, type: 'number' as const },
          ...tail,
        ];
      case 'MP':
        return [
          ...base,
          { header: t.instant('hse.registreLegal.columns.salarie'),       field: (e) => e.employeNom ?? '' },
          { header: t.instant('hse.registreLegal.columns.matriculeCnss'), field: (e) => e.cnssMatricule ?? '' },
          { header: t.instant('hse.registreLegal.columns.tableauMa'),     field: (e) => e.tableauMP ?? '' },
          { header: t.instant('hse.registreLegal.columns.description'),   field: (e) => e.description },
          ...tail,
        ];
      case 'DT':
        return [
          ...base,
          { header: t.instant('hse.registreLegal.columns.chantier'),    field: (e) => e.chantierCode ?? '' },
          { header: t.instant('hse.registreLegal.columns.description'), field: (e) => e.description },
          { header: t.instant('hse.registreLegal.columns.effectif'),    field: (e) => e.effectif ?? 0, type: 'number' as const },
          { header: t.instant('hse.registreLegal.columns.duree'),       field: (e) => e.dureeJours ?? 0, type: 'number' as const },
          ...tail,
        ];
      case 'CHS':
        return [
          ...base,
          { header: t.instant('hse.registreLegal.columns.description'), field: (e) => e.description },
          { header: t.instant('hse.registreLegal.columns.presents'),    field: (e) => e.presents ?? 0, type: 'number' as const },
          { header: t.instant('hse.registreLegal.columns.decisions'),   field: (e) => e.decisions ?? '' },
          ...tail,
        ];
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
