import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent, ToastService, ButtonComponent } from '@lib/anatomy';
import { ExportButtonComponent, type ExportEvent } from '@lib/anatomy/components/molecules/export-button/export-button.component';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';
import { AttachmentListComponent } from '@platform/features/collaboration/doc-manager/components/attachment-list.component';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { PPSPS_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { ChantierApiService } from '@applications/erp/pages/chantiers/services/chantier-api.service';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
} from '@applications/erp/shared/config/attachment-detail.config';
import type { Ppsps, PpspsSection, PpspsStatus } from '../models';
import { PpspsApiService } from './services/ppsps-api.service';

const STATUS_CSS: Record<PpspsStatus, string> = {
  BROUILLON: 'tag--neutral',
  VALIDE: 'tag--success',
  REVISION: 'tag--warning',
  APPLICATIF: 'tag--success',
  ARCHIVE: 'tag--neutral',
};

@Component({
  selector: 'app-ppsps-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ExportButtonComponent,
    FilterResetComponent,
    ButtonComponent,
    AttachmentListComponent,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: ('hse.ppsps.headerTitle' | translate),
        subtitle: ('hse.ppsps.subtitle' | translate),
        breadcrumbs: [
          { label: ('hse.common.breadcrumb' | translate), route: '/hse/tableau-bord' },
          { label: ('hse.routes.ppsps.breadcrumb' | translate) }
        ]
      }"></nf-page-header>

      <!-- Toolbar -->
      <div class="toolbar">
        <input class="search" type="search" [placeholder]="'hse.ppsps.search' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterChantier()" (change)="filterChantier.set($any($event.target).value)">
          <option value="">{{ 'hse.common.messages.tousLesChantiers' | translate }}</option>
          @for (c of chantierOptions(); track c) { <option [value]="c">{{ c }}</option> }
        </select>
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'hse.common.messages.tousLesStatuts' | translate }}</option>
          @for (s of statusEntries(); track s[0]) { <option [value]="s[0]">{{ s[1] }}</option> }
        </select>
        <span class="count">{{ 'hse.ppsps.count' | translate: { n: filtered().length } }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-export-button [data]="filtered()" [columns]="exportCols()" filename="ppsps"
          (exported)="onExported($event)"></nf-export-button>
        <nf-button variant="primary" (clicked)="onNouveau()">{{ 'hse.ppsps.actions.nouveau' | translate }}</nf-button>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'hse.ppsps.columns.chantier' | translate }}</th>
            <th>{{ 'hse.ppsps.columns.numero' | translate }}</th>
            <th class="num">{{ 'hse.ppsps.columns.version' | translate }}</th>
            <th>{{ 'hse.ppsps.columns.coordonnateur' | translate }}</th>
            <th>{{ 'hse.ppsps.columns.date' | translate }}</th>
            <th>{{ 'hse.ppsps.columns.mesuresCollectives' | translate }}</th>
            <th class="num">{{ 'hse.ppsps.columns.hommesJourEstimesShort' | translate }}</th>
            <th>{{ 'hse.ppsps.columns.statut' | translate }}</th>
            <th class="actions">{{ 'hse.ppsps.columns.edition' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr>
                <td class="chantier">
                  <span class="code">{{ p.chantierCode }}</span>
                  <span class="name">{{ p.chantierName }}</span>
                </td>
                <td class="ref">{{ p.numero }}</td>
                <td class="num">{{ p.version ?? 1 }}</td>
                <td>
                  <div>{{ p.coordonnateurSpsNom }}</div>
                  @if (p.coordonnateurSpsTel) {
                    <div class="tel">{{ p.coordonnateurSpsTel }}</div>
                  }
                </td>
                <td class="date">{{ p.date | date:'dd/MM/yyyy' }}</td>
                <td class="mesures">{{ p.mesuresCollectives }}</td>
                <td class="num">{{ p.hommesJourEstimes ?? '—' }}</td>
                <td><span class="tag {{ statusCss(p.status) }}">{{ PPSPS_STATUS_KEYS[p.status] | translate }}</span></td>
                <td class="actions">
                  <nf-button variant="ghost" size="sm" (clicked)="printPpsps(p)">{{ 'hse.ppsps.actions.pdfRappelLoi' | translate }}</nf-button>
                  <nf-button variant="ghost" size="sm" (clicked)="openDocuments(p)">{{ 'hse.ppsps.actions.documents' | translate }}</nf-button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">{{ 'hse.ppsps.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal stub -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="showModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ 'hse.ppsps.modal.title' | translate }}</h2>
            <p class="hint">{{ 'hse.ppsps.modal.hint' | translate }}</p>
            <div class="form">
              <label>{{ 'hse.ppsps.columns.chantier' | translate }}
                <select [value]="formChantier()" (change)="formChantier.set($any($event.target).value)">
                  <option value="">{{ 'hse.common.placeholders.selectionner' | translate }}</option>
                  @for (c of chantiersDisponibles(); track c.code) {
                    <option [value]="c.code">{{ c.code }} · {{ c.name }}</option>
                  }
                </select>
              </label>
              <label>{{ 'hse.ppsps.modal.coordonnateur' | translate }}
                <input type="text" [value]="formCoordo()" (input)="formCoordo.set($any($event.target).value)" [placeholder]="'hse.common.placeholders.nomPrenom' | translate" />
              </label>
            </div>
            <div class="modal-actions">
              <nf-button variant="secondary" (clicked)="showModal.set(false)">{{ 'hse.common.actions.annuler' | translate }}</nf-button>
              <nf-button variant="primary" (clicked)="createPpsps()" [disabled]="!formChantier() || !formCoordo()">{{ 'hse.common.actions.creerBrouillon' | translate }}</nf-button>
            </div>
          </div>
        </div>
      }

      @if (showDocuments()) {
        <div class="modal-backdrop" (click)="closeDocuments()">
          <div class="modal modal--wide" (click)="$event.stopPropagation()">
            <h2>{{ 'hse.ppsps.documentsModal.title' | translate: { numero: documentsPpsps()?.numero ?? '' } }}</h2>
            <p class="hint">{{ 'hse.ppsps.documentsModal.hint' | translate }}</p>
            @if (documentsPpsps(); as doc) {
              <nf-attachment-list
                [entityType]="attachmentEntityType"
                [entityId]="doc.id"
                [attachmentConfig]="attachmentConfig" />
            }
            <div class="modal-actions">
              <nf-button variant="secondary" (clicked)="closeDocuments()">{{ 'hse.common.actions.fermer' | translate }}</nf-button>
            </div>
          </div>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 320px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 9px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); vertical-align: top; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    td.ref { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-700); white-space: nowrap; }
    td.mesures { font-size: 12px; max-width: 320px; line-height: 1.45; color: var(--nf-color-text-secondary); }
    td.chantier { display: flex; flex-direction: column; gap: 2px; }
    td.chantier .code { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-600); }
    td.chantier .name { font-size: 12.5px; color: var(--nf-color-text-primary); }
    .tel { font-size: 11px; color: var(--nf-color-text-secondary); font-variant-numeric: tabular-nums; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .tag--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .tag--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .tag--neutral { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: var(--nf-color-surface); border-radius: 10px; padding: 1.25rem 1.4rem; max-width: 480px; width: 90%; box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18); }
    .modal h2 { margin: 0 0 0.4rem; font-size: 1.05rem; }
    .modal .hint { margin: 0 0 1rem; font-size: 12.5px; color: var(--nf-color-text-secondary); }
    .form { display: flex; flex-direction: column; gap: 0.75rem; }
    .form label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--nf-color-text-secondary); font-weight: 500; }
    .form input, .form select { padding: 8px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
    .modal--wide { max-width: 720px; }
    td.actions { white-space: nowrap; }
  `],
})
export class PpspsListingPage implements OnInit {
  private readonly api = inject(PpspsApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly PPSPS_STATUS_KEYS = PPSPS_STATUS_KEYS;
  readonly attachmentEntityType = ERP_ATTACHMENT_ENTITY_TYPES.PPSPS;
  readonly attachmentConfig = DOCUMENT_ATTACHMENT_CONFIG;

  private readonly items = signal<Ppsps[]>([]);

  readonly search = signal('');
  readonly filterChantier = signal('');
  readonly filterStatus = signal<PpspsStatus | ''>('');

  readonly statusEntries = computed<[PpspsStatus, string][]>(() =>
    (Object.keys(PPSPS_STATUS_KEYS) as PpspsStatus[]).map((s) => [s, this.translate.instant(PPSPS_STATUS_KEYS[s])]),
  );

  readonly chantiersDisponibles = signal<Array<{ code: string; name: string; id: string }>>([]);

  readonly chantierOptions = computed(() =>
    [...new Set(this.items().map((p) => p.chantierCode))].sort(),
  );

  ngOnInit(): void {
    void this.load();
    void this.chantierApi
      .getAll()
      .then(({ items }) =>
        this.chantiersDisponibles.set(items.map((c) => ({ code: c.code, name: c.name, id: c.id }))),
      )
      .catch(() => this.chantiersDisponibles.set([]));
  }

  private async load(): Promise<void> {
    try {
      const rows = await this.api.listByChantier();
      this.items.set(rows);
    } catch {
      this.items.set([]);
    }
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const c = this.filterChantier();
    const st = this.filterStatus();
    let list = this.items();
    if (c) list = list.filter((p) => p.chantierCode === c);
    if (st) list = list.filter((p) => p.status === st);
    if (!q) return list;
    return list.filter((p) =>
      p.chantierCode.toLowerCase().includes(q) ||
      p.chantierName.toLowerCase().includes(q) ||
      p.coordonnateurSpsNom.toLowerCase().includes(q) ||
      p.numero.toLowerCase().includes(q),
    );
  });

  readonly hasFilter = computed(() => !!this.search() || !!this.filterChantier() || !!this.filterStatus());

  readonly exportCols = computed(() => [
    { header: this.translate.instant('hse.ppsps.columns.numero'), field: (p: Ppsps) => p.numero },
    { header: this.translate.instant('hse.ppsps.columns.version'), field: (p: Ppsps) => p.version ?? 1, type: 'number' as const },
    { header: this.translate.instant('hse.ppsps.columns.chantier'), field: (p: Ppsps) => `${p.chantierCode} ${p.chantierName}` },
    { header: this.translate.instant('hse.ppsps.columns.coordonnateur'), field: (p: Ppsps) => p.coordonnateurSpsNom },
    { header: this.translate.instant('hse.ppsps.columns.telephone'), field: (p: Ppsps) => p.coordonnateurSpsTel ?? '' },
    { header: this.translate.instant('hse.ppsps.columns.date'), field: (p: Ppsps) => p.date, type: 'date' as const },
    { header: this.translate.instant('hse.ppsps.columns.mesuresCollectives'), field: (p: Ppsps) => p.mesuresCollectives },
    { header: this.translate.instant('hse.ppsps.columns.effectifMaxJour'), field: (p: Ppsps) => p.effectifsMaxJour ?? '', type: 'number' as const },
    { header: this.translate.instant('hse.ppsps.columns.hommesJourEstimes'), field: (p: Ppsps) => p.hommesJourEstimes ?? '', type: 'number' as const },
    { header: this.translate.instant('hse.ppsps.columns.statut'), field: (p: Ppsps) => this.translate.instant(PPSPS_STATUS_KEYS[p.status]) },
  ]);

  readonly showModal = signal(false);
  readonly formChantier = signal('');
  readonly formCoordo = signal('');
  readonly showDocuments = signal(false);
  readonly documentsPpsps = signal<Ppsps | null>(null);

  resetFilters(): void {
    this.search.set('');
    this.filterChantier.set('');
    this.filterStatus.set('');
  }

  statusCss(s: PpspsStatus): string { return STATUS_CSS[s] ?? 'tag--neutral'; }

  openDocuments(p: Ppsps): void {
    this.documentsPpsps.set(p);
    this.showDocuments.set(true);
  }

  closeDocuments(): void {
    this.showDocuments.set(false);
    this.documentsPpsps.set(null);
  }

  onNouveau(): void {
    this.formChantier.set('');
    this.formCoordo.set('');
    this.showModal.set(true);
  }

  createPpsps(): void {
    const code = this.formChantier();
    const coordo = this.formCoordo().trim();
    const chantier = this.chantiersDisponibles().find((c) => c.code === code);
    if (!chantier || !coordo) return;
    const payload = {
      chantierId: chantier.id,
      chantierCode: chantier.code,
      chantierName: chantier.name,
      coordonnateurSpsNom: coordo,
      date: new Date().toISOString().slice(0, 10),
      mesuresCollectives: this.translate.instant('hse.ppsps.modal.mesureDefaut'),
      status: 'BROUILLON' as PpspsStatus,
    };
    void (async () => {
      try {
        const p = await this.api.createPpsps(payload);
        this.items.update((list) => [p, ...list]);
        this.audit.log(
          'CREATE',
          'PPSPS',
          p.id,
          p.numero,
          this.translate.instant('hse.ppsps.audit.createNote', { chantierCode: p.chantierCode }),
        );
        this.showModal.set(false);
      } catch {
        this.toast.error(this.translate.instant('hse.common.messages.loadError'));
      }
    })();
  }

  onExported(ev: ExportEvent): void {
    this.audit.log(
      ev.format === 'print' ? 'PRINT' : 'EXPORT',
      'PPSPS',
      ev.filename,
      this.translate.instant('hse.ppsps.audit.labelListing'),
      this.translate.instant('hse.ppsps.audit.exportNote', { format: ev.format.toUpperCase(), rowCount: ev.rowCount }),
    );
  }

  printPpsps(p: Ppsps): void {
    void (async () => {
      let doc = p;
      if (!doc.sections?.length) {
        try {
          doc = await this.api.loadWithSections(p.id);
        } catch { /* keep listing row */ }
      }
      this.openPpspsPrint(doc);
    })();
  }

  private openPpspsPrint(p: Ppsps): void {
    const t = this.translate;
    const sectionsBlock = (p.sections ?? [])
      .map(
        (s: PpspsSection) =>
          `<h2>${escapeHtml(s.numero)}. ${escapeHtml(s.titre)}</h2><div class="section-body">${escapeHtml(s.contenu || '')}</div>`,
      )
      .join('');
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>PPSPS ${escapeHtml(p.numero)}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:var(--nf-color-text-primary);}
      h1{font-size:18px;margin:0 0 8px;} h2{font-size:13px;margin:18px 0 6px;text-transform:uppercase;color:var(--nf-color-text-secondary);}
      .muted{color:var(--nf-color-text-secondary);font-size:12px;} table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;}
      th,td{border:1px solid var(--nf-color-border);padding:6px 8px;text-align:left;} th{background:var(--nf-color-bg-muted);}
      .section-body{white-space:pre-wrap;font-size:13px;line-height:1.45;}
      @media print { .no-print{display:none;} }
    </style></head><body>
    <p class="no-print muted">${escapeHtml(t.instant('hse.ppsps.print.disclaimer'))}</p>
    <h1>${escapeHtml(t.instant('hse.ppsps.print.headerTitle', { chantier: p.chantierName }))}</h1>
    <p class="muted">${escapeHtml(t.instant('hse.ppsps.print.headerMeta', { numero: p.numero, code: p.chantierCode, date: p.date, version: p.version ?? 1 }))}</p>
    <h2>${escapeHtml(t.instant('hse.ppsps.print.section1'))}</h2>
    <p>${escapeHtml(t.instant('hse.ppsps.print.section1Body', { chantier: p.chantierName }))}</p>
    <h2>${escapeHtml(t.instant('hse.ppsps.print.section2'))}</h2>
    <p>${escapeHtml(p.coordonnateurSpsNom)}${p.coordonnateurSpsTel ? ' — ' + escapeHtml(p.coordonnateurSpsTel) : ''}</p>
    <h2>${escapeHtml(t.instant('hse.ppsps.print.section3'))}</h2>
    <table><tr><th>${escapeHtml(t.instant('hse.ppsps.print.section3Effectif'))}</th><th>${escapeHtml(t.instant('hse.ppsps.print.section3HommesJour'))}</th></tr>
    <tr><td>${p.effectifsMaxJour ?? '—'}</td><td>${p.hommesJourEstimes ?? '—'}</td></tr></table>
    <h2>${escapeHtml(t.instant('hse.ppsps.print.section4'))}</h2>
    <p>${escapeHtml(p.mesuresCollectives)}</p>
    <h2>${escapeHtml(t.instant('hse.ppsps.print.section5'))}</h2>
    ${sectionsBlock}
    <h2>${escapeHtml(t.instant('hse.ppsps.print.section6'))}</h2>
    <p>${escapeHtml(t.instant('hse.ppsps.print.section6Body'))}</p>
    ${p.observations ? `<h2>${escapeHtml(t.instant('hse.ppsps.print.section7'))}</h2><p>${escapeHtml(p.observations)}</p>` : ''}
    <script>window.onload=function(){window.print();}</script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    this.audit.log('PRINT', 'PPSPS', p.id, p.numero, t.instant('hse.ppsps.audit.printNote'));
  }
}


function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
