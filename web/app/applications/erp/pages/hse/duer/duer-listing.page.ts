import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent, ToastService, ButtonComponent } from '@lib/anatomy';
import { ExportButtonComponent, type ExportEvent } from '@lib/anatomy/components/molecules/export-button/export-button.component';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';
import { AttachmentListComponent } from '@platform/features/collaboration/doc-manager/components/attachment-list.component';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { DUER_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { ChantierApiService } from '@applications/erp/pages/chantiers/services/chantier-api.service';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
} from '@applications/erp/shared/config/attachment-detail.config';
import type { Duer, DuerRisqueMatriceRow, DuerStatus } from '../models';
import { DuerApiService } from './services/duer-api.service';

const STATUS_CSS: Record<DuerStatus, string> = {
  BROUILLON: 'tag--neutral',
  VALIDE: 'tag--success',
  REVISION: 'tag--warning',
};

@Component({
  selector: 'app-duer-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
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
        title: ('hse.duer.headerTitle' | translate),
        subtitle: ('hse.duer.subtitle' | translate),
        breadcrumbs: [
          { label: ('hse.common.breadcrumb' | translate), route: '/hse/tableau-bord' },
          { label: ('hse.routes.duer.breadcrumb' | translate) }
        ]
      }"></nf-page-header>

      <!-- Toolbar -->
      <div class="toolbar">
        <input class="search" type="search" [placeholder]="'hse.duer.search' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterChantier()" (change)="filterChantier.set($any($event.target).value)">
          <option value="">{{ 'hse.common.messages.tousLesChantiers' | translate }}</option>
          @for (c of chantierOptions(); track c) { <option [value]="c">{{ c }}</option> }
        </select>
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'hse.common.messages.tousLesStatuts' | translate }}</option>
          @for (s of statusEntries(); track s[0]) { <option [value]="s[0]">{{ s[1] }}</option> }
        </select>
        <span class="count">{{ 'hse.duer.count' | translate: { n: filtered().length } }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-export-button [data]="filtered()" [columns]="exportCols()" filename="duer"
          (exported)="onExported($event)"></nf-export-button>
        <nf-button variant="primary" (clicked)="onNouveau()">{{ 'hse.duer.actions.nouveau' | translate }}</nf-button>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'hse.duer.columns.chantier' | translate }}</th>
            <th>{{ 'hse.duer.columns.numero' | translate }}</th>
            <th>{{ 'hse.duer.columns.version' | translate }}</th>
            <th>{{ 'hse.duer.columns.dateRevision' | translate }}</th>
            <th>{{ 'hse.duer.columns.auteur' | translate }}</th>
            <th class="num">{{ 'hse.duer.columns.risquesIdentifies' | translate }}</th>
            <th class="num">{{ 'hse.duer.columns.actionsCorrectives' | translate }}</th>
            <th>{{ 'hse.duer.columns.statut' | translate }}</th>
            <th class="actions">{{ 'hse.duer.columns.edition' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (d of filtered(); track d.id) {
              <tr>
                <td class="chantier">
                  <span class="code">{{ d.chantierCode }}</span>
                  <span class="name">{{ d.chantierName }}</span>
                </td>
                <td class="ref">{{ d.numero }}</td>
                <td class="version">{{ d.version }}</td>
                <td class="date">{{ d.dateRevision | date:'dd/MM/yyyy' }}</td>
                <td>{{ d.auteurNom }}</td>
                <td class="num">{{ d.risquesIdentifies }}</td>
                <td class="num">{{ d.actionsCorrectives }}</td>
                <td><span class="tag {{ statusCss(d.status) }}">{{ DUER_STATUS_KEYS[d.status] | translate }}</span></td>
                <td class="actions">
                  <nf-button variant="ghost" size="sm" (clicked)="openMatrice(d)">{{ 'hse.duer.actions.matrice' | translate }}</nf-button>
                  <nf-button variant="ghost" size="sm" (clicked)="openDocuments(d)">{{ 'hse.duer.actions.documents' | translate }}</nf-button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">{{ 'hse.duer.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal stub -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="showModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ 'hse.duer.modal.title' | translate }}</h2>
            <p class="hint">{{ 'hse.duer.modal.hint' | translate }}</p>
            <div class="form">
              <label>{{ 'hse.duer.modal.chantier' | translate }}
                <select [value]="formChantier()" (change)="formChantier.set($any($event.target).value)">
                  <option value="">{{ 'hse.common.placeholders.selectionner' | translate }}</option>
                  @for (c of chantiersDisponibles(); track c.code) {
                    <option [value]="c.code">{{ c.code }} · {{ c.name }}</option>
                  }
                </select>
              </label>
              <label>{{ 'hse.duer.modal.auteur' | translate }}
                <input type="text" [value]="formAuteur()" (input)="formAuteur.set($any($event.target).value)" [placeholder]="'hse.common.placeholders.nomPrenom' | translate" />
              </label>
            </div>
            <div class="modal-actions">
              <nf-button variant="secondary" (clicked)="showModal.set(false)">{{ 'hse.common.actions.annuler' | translate }}</nf-button>
              <nf-button variant="primary" (clicked)="createDuer()" [disabled]="!formChantier() || !formAuteur()">{{ 'hse.common.actions.creerBrouillon' | translate }}</nf-button>
            </div>
          </div>
        </div>
      }

      @if (showMatrice()) {
        <div class="modal-backdrop" (click)="closeMatrice()">
          <div class="modal modal--wide" (click)="$event.stopPropagation()">
            <h2>{{ 'hse.duer.matrice.titleWithNumero' | translate: { numero: matriceDuer()?.numero ?? '' } }}</h2>
            <p class="hint">{{ 'hse.duer.matrice.hint' | translate }}</p>
            <div class="table-scroll">
              <table class="matrice">
                <thead><tr>
                  <th>{{ 'hse.duer.matrice.risque' | translate }}</th>
                  <th>{{ 'hse.duer.matrice.probabilite' | translate }}</th>
                  <th>{{ 'hse.duer.matrice.gravite' | translate }}</th>
                  <th class="num">{{ 'hse.duer.matrice.score' | translate }}</th>
                </tr></thead>
                <tbody>
                  @for (row of matriceDraft(); track row.id) {
                    <tr>
                      <td>{{ row.libelle }}</td>
                      <td>
                        <select [ngModel]="row.probabilite" (ngModelChange)="patchMatrice(row.id, 'probabilite', $event)">
                          @for (n of echelle; track n) { <option [ngValue]="n">{{ n }}</option> }
                        </select>
                      </td>
                      <td>
                        <select [ngModel]="row.gravite" (ngModelChange)="patchMatrice(row.id, 'gravite', $event)">
                          @for (n of echelle; track n) { <option [ngValue]="n">{{ n }}</option> }
                        </select>
                      </td>
                      <td class="num">{{ score(row) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="modal-actions">
              <nf-button variant="secondary" (clicked)="closeMatrice()">{{ 'hse.common.actions.fermer' | translate }}</nf-button>
              <nf-button variant="primary" (clicked)="saveMatrice()">{{ 'hse.common.actions.enregistrer' | translate }}</nf-button>
            </div>
          </div>
        </div>
      }
      @if (showDocuments()) {
        <div class="modal-backdrop" (click)="closeDocuments()">
          <div class="modal modal--wide" (click)="$event.stopPropagation()">
            <h2>{{ 'hse.duer.documentsModal.title' | translate: { numero: documentsDuer()?.numero ?? '' } }}</h2>
            <p class="hint">{{ 'hse.duer.documentsModal.hint' | translate }}</p>
            @if (documentsDuer(); as doc) {
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
    td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    td.ref { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-700); white-space: nowrap; }
    td.version { font-family: monospace; font-size: 12px; color: var(--nf-color-text-secondary); }
    td.chantier { display: flex; flex-direction: column; gap: 2px; }
    td.chantier .code { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-600); }
    td.chantier .name { font-size: 12.5px; color: var(--nf-color-text-primary); }
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
    .table-scroll { max-height: 50vh; overflow: auto; margin-bottom: 0.5rem; }
    .matrice td, .matrice th { padding: 6px 8px; }
    td.actions { white-space: nowrap; }
  `],
})
export class DuerListingPage implements OnInit {
  private readonly duerApi = inject(DuerApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly DUER_STATUS_KEYS = DUER_STATUS_KEYS;
  readonly attachmentEntityType = ERP_ATTACHMENT_ENTITY_TYPES.DUER;
  readonly attachmentConfig = DOCUMENT_ATTACHMENT_CONFIG;

  readonly duerList = signal<Duer[]>([]);
  readonly search = signal('');
  readonly filterChantier = signal('');
  readonly filterStatus = signal<DuerStatus | ''>('');

  readonly statusEntries = computed<[DuerStatus, string][]>(() =>
    (Object.keys(DUER_STATUS_KEYS) as DuerStatus[]).map((s) => [s, this.translate.instant(DUER_STATUS_KEYS[s])]),
  );

  readonly chantiersDisponibles = signal<Array<{ code: string; name: string; id: string }>>([]);

  readonly chantierOptions = computed(() =>
    [...new Set(this.duerList().map((d) => d.chantierCode))].sort(),
  );

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const c = this.filterChantier();
    const st = this.filterStatus();
    let list = this.duerList();
    if (c) list = list.filter((d) => d.chantierCode === c);
    if (st) list = list.filter((d) => d.status === st);
    if (!q) return list;
    return list.filter((d) =>
      d.chantierCode.toLowerCase().includes(q) ||
      d.chantierName.toLowerCase().includes(q) ||
      d.auteurNom.toLowerCase().includes(q) ||
      d.numero.toLowerCase().includes(q),
    );
  });

  readonly hasFilter = computed(() => !!this.search() || !!this.filterChantier() || !!this.filterStatus());

  readonly exportCols = computed(() => [
    { header: this.translate.instant('hse.duer.columns.numero'), field: (d: Duer) => d.numero },
    { header: this.translate.instant('hse.duer.columns.chantier'), field: (d: Duer) => `${d.chantierCode} ${d.chantierName}` },
    { header: this.translate.instant('hse.duer.columns.version'), field: (d: Duer) => d.version },
    { header: this.translate.instant('hse.duer.columns.dateRevision'), field: (d: Duer) => d.dateRevision, type: 'date' as const },
    { header: this.translate.instant('hse.duer.columns.auteur'), field: (d: Duer) => d.auteurNom },
    { header: this.translate.instant('hse.duer.columns.risquesIdentifies'), field: (d: Duer) => d.risquesIdentifies, type: 'number' as const },
    { header: this.translate.instant('hse.duer.columns.actionsCorrectives'), field: (d: Duer) => d.actionsCorrectives, type: 'number' as const },
    { header: this.translate.instant('hse.duer.columns.statut'), field: (d: Duer) => this.translate.instant(DUER_STATUS_KEYS[d.status]) },
    { header: this.translate.instant('hse.duer.columns.observations'), field: (d: Duer) => d.observations ?? '' },
  ]);

  readonly showModal = signal(false);
  readonly formChantier = signal('');
  readonly formAuteur = signal('');

  readonly showMatrice = signal(false);
  readonly matriceDuer = signal<Duer | null>(null);
  readonly matriceDraft = signal<DuerRisqueMatriceRow[]>([]);
  readonly showDocuments = signal(false);
  readonly documentsDuer = signal<Duer | null>(null);
  readonly echelle = [1, 2, 3, 4] as const;

  resetFilters(): void {
    this.search.set('');
    this.filterChantier.set('');
    this.filterStatus.set('');
  }

  statusCss(s: DuerStatus): string { return STATUS_CSS[s] ?? 'tag--neutral'; }

  ngOnInit(): void {
    void this.reloadList();
    void this.chantierApi
      .getAll()
      .then(({ items }) =>
        this.chantiersDisponibles.set(items.map((c) => ({ code: c.code, name: c.name, id: c.id }))),
      )
      .catch(() => this.chantiersDisponibles.set([]));
  }

  private async reloadList(): Promise<void> {
    try {
      const rows = await this.duerApi.list();
      this.duerList.set(rows);
    } catch {
      this.duerList.set([]);
    }
  }

  onNouveau(): void {
    this.formChantier.set('');
    this.formAuteur.set('');
    this.showModal.set(true);
  }

  async createDuer(): Promise<void> {
    const code = this.formChantier();
    const auteur = this.formAuteur().trim();
    const chantier = this.chantiersDisponibles().find((c) => c.code === code);
    if (!chantier || !auteur) return;

    const payload = {
      chantierId: chantier.id,
      chantierCode: chantier.code,
      chantierName: chantier.name,
      version: 'v1.0',
      dateRevision: new Date().toISOString().slice(0, 10),
      auteurId: 'current-user',
      auteurNom: auteur,
      status: 'BROUILLON',
    };

    try {
      const d = await this.duerApi.create(payload);
      this.duerList.update((list) => [d, ...list]);
      this.audit.log(
        'CREATE',
        'DUER',
        d.id,
        d.numero,
        this.translate.instant('hse.duer.audit.createNote', { chantierCode: d.chantierCode }),
      );
      this.showModal.set(false);
    } catch {
      this.toast.error(this.translate.instant('hse.common.messages.loadError'));
    }
  }

  onExported(ev: ExportEvent): void {
    this.audit.log(
      ev.format === 'print' ? 'PRINT' : 'EXPORT',
      'DUER',
      ev.filename,
      this.translate.instant('hse.duer.audit.labelListing'),
      this.translate.instant('hse.duer.audit.exportNote', { format: ev.format.toUpperCase(), rowCount: ev.rowCount }),
    );
  }

  async openMatrice(d: Duer): Promise<void> {
    this.matriceDuer.set(d);
    let rows = d.matriceRisques ?? [];
    try {
      rows = await this.duerApi.listRisques(d.id);
    } catch {
      /* keep listing row matrice */
    }
    this.matriceDraft.set([...rows]);
    this.showMatrice.set(true);
  }

  closeMatrice(): void {
    this.showMatrice.set(false);
    this.matriceDuer.set(null);
  }

  openDocuments(d: Duer): void {
    this.documentsDuer.set(d);
    this.showDocuments.set(true);
  }

  closeDocuments(): void {
    this.showDocuments.set(false);
    this.documentsDuer.set(null);
  }

  patchMatrice(id: string, field: 'probabilite' | 'gravite', value: number): void {
    const v = Math.min(4, Math.max(1, Math.round(Number(value)))) as 1 | 2 | 3 | 4;
    this.matriceDraft.update((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: v } : r)),
    );
  }

  score(row: DuerRisqueMatriceRow): number {
    return row.probabilite * row.gravite;
  }

  async saveMatrice(): Promise<void> {
    const d = this.matriceDuer();
    if (!d) return;
    const draft = this.matriceDraft();
    try {
      await this.duerApi.replaceRisques(d.id, draft);
      await this.reloadList();
      this.audit.log(
        'UPDATE',
        'DUER',
        d.id,
        d.numero,
        this.translate.instant('hse.duer.audit.matriceNote'),
      );
      this.closeMatrice();
    } catch {
      this.toast.error(this.translate.instant('hse.common.messages.loadError'));
    }
  }
}
